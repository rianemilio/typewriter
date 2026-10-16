import type { Field, InkChar, LineKind, PaperLine, Phase, StampKind, StampMark } from '../../types';

export const MAX_CHARS = 20;
export const BELL_COLUMN = 27;

// Sheet geometry. Keep in sync with Paper.module.scss and $line-height.
export const LINE_HEIGHT = 30;
const PAPER_PADDING_TOP = 52;
const PAPER_PADDING_BOTTOM = 240;
const PAPER_MIN_HEIGHT = 1150;
const PAPER_START_Y = 110;

export const FEED_EASE = 'cubic-bezier(.33,.8,.25,1)';
export const EJECT_EASE = 'cubic-bezier(.55,0,.8,.4)';

export const TITLE_LINE = 0;
export const RULE_LINE = 1;

/** Line indices of the current attempt's form. */
export interface Block {
  attempt: number | null;
  login: number;
  password: number;
  /** Blank line the carriage rests on while the stamp comes down */
  rest: number;
}

export type CarriageMotion = 'type' | 'return' | 'none';

export interface MachineState {
  phase: Phase;
  /** An automatic sequence is running; user input is ignored */
  busy: boolean;
  /** Field accepting keystrokes */
  field: Field | null;
  /** Last field opened, drives the hidden input's type and label */
  inputField: Field;
  values: Record<Field, string>;
  attempt: number;
  lines: PaperLine[];
  block: Block;
  stamps: StampMark[];
  col: number;
  carriage: { motion: CarriageMotion; ms: number; returning: boolean };
  paper: { y: number; ms: number; ease: string };
  thuds: number;
  announcement: string;
}

export type Action =
  | { type: 'reset'; lines: PaperLine[]; block: Block }
  | { type: 'feed'; y: number; ms: number; ease?: string }
  | { type: 'queue'; line: number; chars: InkChar[] }
  | { type: 'strike'; line: number; id: number }
  | { type: 'carriageReturn'; line: number; ms: number }
  | { type: 'carriageReturned' }
  | { type: 'snapCarriage' }
  | { type: 'beginField'; field: Field }
  | { type: 'fieldReady'; field: Field }
  | { type: 'input'; field: Field; value: string; erase: number; chars: InkChar[] }
  | { type: 'submit' }
  | { type: 'verdict'; stamp: StampMark }
  | { type: 'impact' }
  | { type: 'announce'; text: string }
  | { type: 'newAttempt'; lines: PaperLine[]; block: Block }
  | { type: 'grantedReady' }
  | { type: 'eject' };

// ---------- Factories ----------
// Everything random or id-bearing is created here, outside the reducer, so the
// reducer stays pure and a character never changes once it is on the page.

let lastId = 0;
const nextId = () => ++lastId;
const round = (n: number, digits: number) => Number(n.toFixed(digits));

export function inkChar(char: string, struck = false): InkChar {
  return {
    id: nextId(),
    char,
    dy: round(Math.random() * 1.4 - 0.6, 2),
    rotation: round(Math.random() * 2.4 - 1.2, 2),
    opacity: round(0.74 + Math.random() * 0.26, 2),
    struck,
  };
}

const paperLine = (kind: LineKind = 'text'): PaperLine => ({ id: nextId(), kind, chars: [] });

function formBlock(start: number, attempt: number): { lines: PaperLine[]; block: Block } {
  const lines: PaperLine[] = [];
  let attemptLine: number | null = null;
  if (attempt > 1) {
    lines.push(paperLine());
    attemptLine = start + lines.length;
    lines.push(paperLine());
  }
  const login = start + lines.length;
  lines.push(paperLine(), paperLine(), paperLine(), paperLine());
  return { lines, block: { attempt: attemptLine, login, password: login + 1, rest: login + 3 } };
}

function freshSheet() {
  const header = [paperLine('title'), paperLine('rule'), paperLine()];
  const form = formBlock(header.length, 1);
  return { lines: [...header, ...form.lines], block: form.block };
}

export function resetSheet(): Action {
  return { type: 'reset', ...freshSheet() };
}

export function newAttempt(state: MachineState): Action {
  return { type: 'newAttempt', ...formBlock(state.lines.length, state.attempt + 1) };
}

export function createStamp(kind: StampKind, block: Block): StampMark {
  const rotation = kind === 'granted' ? 6 + Math.random() * 3 : -13 + Math.random() * 4;
  return {
    id: nextId(),
    kind,
    top: lineTop(block.login) + LINE_HEIGHT,
    offsetX: round(Math.random() * 30 - 15, 0),
    rotation: round(rotation, 1),
  };
}

// ---------- Geometry ----------

export function lineTop(line: number): number {
  return PAPER_PADDING_TOP + line * LINE_HEIGHT;
}

/** Paper offset that puts a line on the roller's typing point. */
export function feedY(line: number): number {
  return -lineTop(line);
}

export function paperHeight(lineCount: number): number {
  return Math.max(PAPER_MIN_HEIGHT, PAPER_PADDING_TOP + PAPER_PADDING_BOTTOM + lineCount * LINE_HEIGHT);
}

export function carriageOffset(col: number, viewportWidth: number): number {
  const amplitude = viewportWidth < 560 ? 0.55 : 1;
  return Math.max(-62, 40 - col * 3.2) * amplitude;
}

// ---------- Reducer ----------

function sheetState({ lines, block }: { lines: PaperLine[]; block: Block }): MachineState {
  return {
    phase: 'intro',
    busy: true,
    field: null,
    inputField: 'login',
    values: { login: '', password: '' },
    attempt: 1,
    lines,
    block,
    stamps: [],
    col: 0,
    carriage: { motion: 'none', ms: 0, returning: false },
    paper: { y: PAPER_START_Y, ms: 0, ease: FEED_EASE },
    thuds: 0,
    announcement: '',
  };
}

export function createInitialState(): MachineState {
  return sheetState(freshSheet());
}

function updateLine(lines: PaperLine[], index: number, update: (line: PaperLine) => PaperLine) {
  return lines.map((line, i) => (i === index ? update(line) : line));
}

const TYPING = { motion: 'type', ms: 0, returning: false } as const;

export function reducer(state: MachineState, action: Action): MachineState {
  switch (action.type) {
    case 'reset':
      return {
        ...sheetState(action),
        inputField: state.inputField,
        thuds: state.thuds,
        announcement: state.announcement,
      };

    case 'feed':
      return { ...state, paper: { y: action.y, ms: action.ms, ease: action.ease ?? FEED_EASE } };

    case 'queue':
      return {
        ...state,
        lines: updateLine(state.lines, action.line, (l) => ({ ...l, chars: [...l.chars, ...action.chars] })),
      };

    case 'strike':
      return {
        ...state,
        col: state.col + 1,
        carriage: { ...TYPING, returning: state.carriage.returning },
        lines: updateLine(state.lines, action.line, (l) => ({
          ...l,
          chars: l.chars.map((c) => (c.id === action.id ? { ...c, struck: true } : c)),
        })),
      };

    case 'carriageReturn':
      return {
        ...state,
        col: 0,
        carriage: { motion: 'return', ms: action.ms, returning: true },
        paper: { y: feedY(action.line), ms: action.ms, ease: FEED_EASE },
      };

    case 'carriageReturned':
      return { ...state, carriage: { ...state.carriage, returning: false } };

    case 'snapCarriage':
      return { ...state, carriage: { ...state.carriage, motion: 'none' } };

    case 'beginField':
      return {
        ...state,
        phase: action.field === 'login' ? 'typingLogin' : 'typingPassword',
        busy: true,
        field: null,
      };

    case 'fieldReady':
      return {
        ...state,
        busy: false,
        field: action.field,
        inputField: action.field,
        values: { ...state.values, [action.field]: '' },
      };

    case 'input': {
      if (state.busy || state.field !== action.field) return state;
      const { erase, chars } = action;
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        col: Math.max(0, state.col - erase) + chars.length,
        carriage: { ...TYPING, returning: state.carriage.returning },
        lines: updateLine(state.lines, state.block[action.field], (l) => ({
          ...l,
          chars: [...l.chars.slice(0, l.chars.length - erase), ...chars],
        })),
      };
    }

    case 'submit':
      if (state.busy || !state.field) return state;
      return {
        ...state,
        phase: state.field === 'login' ? 'typingPassword' : 'validating',
        busy: true,
        field: null,
      };

    case 'verdict':
      return { ...state, phase: action.stamp.kind, stamps: [...state.stamps, action.stamp] };

    case 'impact':
      return { ...state, thuds: state.thuds + 1 };

    case 'announce':
      return { ...state, announcement: action.text };

    case 'newAttempt':
      return {
        ...state,
        attempt: state.attempt + 1,
        values: { login: '', password: '' },
        lines: [...state.lines, ...action.lines],
        block: action.block,
      };

    case 'grantedReady':
      return { ...state, busy: false };

    case 'eject':
      if (state.phase !== 'granted' || state.busy) return state;
      return { ...state, phase: 'ejecting', busy: true, announcement: 'New sheet loaded.' };
  }
}
