import type { SoundPlayer } from '../../hooks/useTypewriterSound';
import { login } from '../../services/auth';
import type { Field, Phase } from '../../types';
import { delay, motionMs, nextFrame, settle } from '../../utils/timing';
import {
  BELL_COLUMN,
  EJECT_EASE,
  RULE_LINE,
  TITLE_LINE,
  createStamp,
  feedY,
  inkChar,
  newAttempt,
  paperHeight,
  resetSheet,
} from './machine';
import type { Action, MachineState } from './machine';

export interface SequenceContext {
  send(action: Action): void;
  current(): MachineState;
  sound: SoundPlayer;
  focusInput(): void;
  signal: AbortSignal;
}

type Sequence = (ctx: SequenceContext) => Promise<void>;

const wait = (ctx: SequenceContext, ms: number) => delay(motionMs(ms), ctx.signal);

export function playStrike(sound: SoundPlayer, char: string, col: number) {
  if (char.trim()) sound.key();
  else sound.space();
  if (col === BELL_COLUMN) sound.bell();
}

/** Queues the whole text first so centered lines don't shift while being typed. */
async function typeText(ctx: SequenceContext, line: number, text: string, speed: number) {
  const chars = [...text].map((c) => inkChar(c));
  ctx.send({ type: 'queue', line, chars });
  for (const ch of chars) {
    ctx.send({ type: 'strike', line, id: ch.id });
    playStrike(ctx.sound, ch.char, ctx.current().col);
    await wait(ctx, speed + Math.random() * speed * 0.6);
  }
}

async function carriageReturn(ctx: SequenceContext, line: number, ms = 420) {
  ctx.sound.carriageReturn();
  ctx.send({ type: 'carriageReturn', line, ms });
  await wait(ctx, ms);
  ctx.send({ type: 'carriageReturned' });
}

async function stampImpact(ctx: SequenceContext) {
  await wait(ctx, 280);
  ctx.sound.stamp();
  ctx.send({ type: 'impact' });
  await wait(ctx, 400);
}

const intro: Sequence = async (ctx) => {
  await settle(document.fonts.ready, ctx.signal);
  ctx.focusInput();
  // let the fresh sheet settle at its start position before feeding it
  await nextFrame(ctx.signal);
  ctx.send({ type: 'feed', y: feedY(TITLE_LINE), ms: 1000 });
  await wait(ctx, 1000);
  await typeText(ctx, TITLE_LINE, 'ACCESS FORM', 80);
  await carriageReturn(ctx, RULE_LINE, 300);
  await typeText(ctx, RULE_LINE, '===========', 26);
  await carriageReturn(ctx, ctx.current().block.login, 520);
  ctx.send({ type: 'beginField', field: 'login' });
};

const openField =
  (field: Field): Sequence =>
  async (ctx) => {
    const { block } = ctx.current();
    if (field === 'password') await carriageReturn(ctx, block.password);
    await typeText(ctx, block[field], field === 'login' ? 'Login: ' : 'Password: ', 45);
    ctx.send({ type: 'fieldReady', field });
    ctx.focusInput();
  };

const validate: Sequence = async (ctx) => {
  const { block, values } = ctx.current();
  await carriageReturn(ctx, block.rest, 560);
  await wait(ctx, 200);
  // a failed request is stamped as denied rather than leaving the machine stuck
  const ok = await settle(
    login(values.login, values.password).catch(() => false),
    ctx.signal,
  );
  ctx.send({ type: 'verdict', stamp: createStamp(ok ? 'granted' : 'denied', block) });
};

const denied: Sequence = async (ctx) => {
  await stampImpact(ctx);
  ctx.send({ type: 'announce', text: 'Access denied. The sheet advanced for a new attempt.' });
  await wait(ctx, 1400);
  ctx.send(newAttempt(ctx.current()));
  const { block, attempt } = ctx.current();
  if (block.attempt !== null) {
    await carriageReturn(ctx, block.attempt, 900);
    await typeText(ctx, block.attempt, `Attempt no. ${attempt}`, 40);
  }
  await carriageReturn(ctx, block.login, 380);
  ctx.send({ type: 'beginField', field: 'login' });
};

const granted: Sequence = async (ctx) => {
  await stampImpact(ctx);
  ctx.send({ type: 'announce', text: 'Access granted. Press New sheet to start over.' });
  await wait(ctx, 500);
  ctx.send({ type: 'grantedReady' });
  ctx.focusInput();
};

const eject: Sequence = async (ctx) => {
  ctx.sound.carriageReturn();
  const { paper, lines } = ctx.current();
  const y = paper.y - (paperHeight(lines.length) + window.innerHeight);
  ctx.send({ type: 'feed', y, ms: 900, ease: EJECT_EASE });
  await wait(ctx, 900);
  ctx.send(resetSheet());
};

/**
 * The automatic part of each phase. Each one ends by sending the action that
 * moves to the next phase (or hands control back to the user).
 */
export const SEQUENCES: Partial<Record<Phase, Sequence>> = {
  intro,
  typingLogin: openField('login'),
  typingPassword: openField('password'),
  validating: validate,
  denied,
  granted,
  ejecting: eject,
};
