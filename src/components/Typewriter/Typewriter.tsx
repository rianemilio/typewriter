import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useHiddenInput } from '../../hooks/useHiddenInput';
import type { SoundPlayer } from '../../hooks/useTypewriterSound';
import { cx } from '../../utils/cx';
import { Carriage } from '../Carriage/Carriage';
import { Paper } from '../Paper/Paper';
import { ReturnKey } from '../ReturnKey/ReturnKey';
import { MAX_CHARS, carriageOffset, inkChar } from './machine';
import { SEQUENCES, playStrike } from './sequences';
import { useMachine } from './useMachine';
import styles from './Typewriter.module.scss';

export interface TypewriterHandle {
  focus(): void;
}

interface TypewriterProps {
  sound: SoundPlayer;
}

export const Typewriter = forwardRef<TypewriterHandle, TypewriterProps>(function Typewriter({ sound }, ref) {
  const [state, send, current] = useMachine();
  const machineRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [keyPressed, setKeyPressed] = useState(false);
  const pressTimer = useRef<number | undefined>(undefined);

  const handleReturn = useCallback(() => {
    const s = current();
    if (s.busy) return;
    send({ type: s.phase === 'granted' ? 'eject' : 'submit' });
  }, [current, send]);

  const handleEnter = () => {
    setKeyPressed(true);
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setKeyPressed(false), 140);
    handleReturn();
  };

  const handleInput = (raw: string): string => {
    const s = current();
    const { field } = s;
    if (s.busy || !field) return field ? s.values[field] : '';

    const prev = s.values[field];
    const next = raw.replace(/[\r\n]/g, '').slice(0, MAX_CHARS);
    let erase = 0;
    let typed = '';
    let silent = false;
    if (next.startsWith(prev)) {
      typed = next.slice(prev.length);
    } else if (prev.startsWith(next)) {
      erase = prev.length - next.length;
    } else {
      // autocorrect or a mobile keyboard replaced the text: retype it quietly
      erase = prev.length;
      typed = next;
      silent = true;
    }

    const chars = [...typed].map((c) => inkChar(field === 'password' ? 'X' : c, true));
    const startCol = Math.max(0, s.col - erase);
    send({ type: 'input', field, value: next, erase, chars });

    if (erase) sound.space();
    if (!silent) chars.forEach((ch, i) => playStrike(sound, ch.char, startCol + i + 1));
    return next;
  };

  const input = useHiddenInput({
    field: state.field,
    value: state.field ? state.values[state.field] : '',
    kind: state.inputField,
    onInput: handleInput,
    onEnter: handleEnter,
  });
  const { focus, focusUnlessOnButton } = input;

  useImperativeHandle(ref, () => ({ focus }), [focus]);

  // Each phase may start an automatic sequence. It is aborted if the phase
  // changes or the component unmounts (including StrictMode's dev remount).
  useEffect(() => {
    const sequence = SEQUENCES[state.phase];
    if (!sequence) return;
    const controller = new AbortController();
    const { signal } = controller;
    sequence({ send, current, sound, focusInput: focusUnlessOnButton, signal }).catch((error: unknown) => {
      if (!signal.aborted) console.error(error);
    });
    return () => controller.abort();
  }, [state.phase, send, current, sound, focusUnlessOnButton]);

  // Restart the thud animation on every stamp impact
  useEffect(() => {
    const el = machineRef.current;
    if (!state.thuds || !el) return;
    el.classList.remove(styles.thud);
    void el.offsetWidth;
    el.classList.add(styles.thud);
  }, [state.thuds]);

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
      send({ type: 'snapCarriage' });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [send]);

  useEffect(() => () => window.clearTimeout(pressTimer.current), []);

  const done = state.phase === 'granted' && !state.busy;
  const newSheet = done || state.phase === 'ejecting';
  const showHint = !state.busy && !done && !input.focused;

  return (
    <>
      <div className={styles.machine} ref={machineRef}>
        <Carriage
          offset={carriageOffset(state.col, viewportWidth)}
          motion={state.carriage.motion}
          ms={state.carriage.ms}
          returning={state.carriage.returning}
        >
          <Paper
            lines={state.lines}
            stamps={state.stamps}
            y={state.paper.y}
            ms={state.paper.ms}
            ease={state.paper.ease}
            caretLine={state.field ? state.block[state.field] : null}
            focused={input.focused}
          />
        </Carriage>

        <div className={styles.body}>
          <span className={styles.decal}>Corvina No. 5</span>
          <ReturnKey label={newSheet ? 'New sheet' : 'Return ↵'} pressed={keyPressed} onPress={handleReturn} />
          <span className={cx(styles.hint, showHint && styles.hintVisible)}>Click the paper to type</span>
        </div>

        <input className={styles.keyInput} {...input.inputProps} />
      </div>

      <p className="sr-only" aria-live="polite">
        {state.announcement}
      </p>
    </>
  );
});
