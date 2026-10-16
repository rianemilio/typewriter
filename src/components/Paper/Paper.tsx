import { memo, useLayoutEffect, useRef } from 'react';
import type { CSSVars, InkChar, PaperLine, StampMark } from '../../types';
import { cx } from '../../utils/cx';
import { motionMs } from '../../utils/timing';
import { Stamp } from '../Stamp/Stamp';
import { WornInkFilter } from '../Stamp/WornInkFilter';
import styles from './Paper.module.scss';

interface PaperProps {
  lines: PaperLine[];
  stamps: StampMark[];
  /** Vertical offset of the sheet in px */
  y: number;
  /** Feed duration; 0 jumps instantly */
  ms: number;
  ease: string;
  /** Line showing the caret, if any */
  caretLine: number | null;
  focused: boolean;
}

const LINE_CLASS = { title: styles.title, rule: styles.rule, text: undefined };

function Char({ ch }: { ch: InkChar }) {
  const style: CSSVars = { '--dy': `${ch.dy}px`, '--r': `${ch.rotation}deg`, '--o': ch.opacity };
  return (
    <span className={cx(styles.ch, ch.struck ? styles.struck : styles.pending)} style={style}>
      {ch.char}
    </span>
  );
}

const Line = memo(function Line({ line, caret, caretHidden }: { line: PaperLine; caret: boolean; caretHidden: boolean }) {
  return (
    <div className={cx(styles.line, LINE_CLASS[line.kind])}>
      {line.chars.map((ch) => (
        <Char key={ch.id} ch={ch} />
      ))}
      {caret && <span className={cx(styles.caret, caretHidden && styles.caretHidden)}>_</span>}
    </div>
  );
});

export function Paper({ lines, stamps, y, ms, ease, caretLine, focused }: PaperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const transition = ms ? `transform ${motionMs(ms)}ms ${ease}` : 'none';

  // Commit an instant jump (a fresh sheet) before the next feed animates from it
  useLayoutEffect(() => {
    if (transition === 'none') ref.current?.getBoundingClientRect();
  }, [y, transition]);

  return (
    <>
      <WornInkFilter />
      {/* the feed clips the sheet at the roller's center line */}
      <div className={styles.feed}>
        <div className={styles.anchor}>
          <div
            ref={ref}
            className={styles.paper}
            aria-hidden="true"
            style={{ transform: `translate(-50%, ${y}px)`, transition }}
          >
            {lines.map((line, i) => (
              <Line key={line.id} line={line} caret={caretLine === i} caretHidden={!focused} />
            ))}
            {stamps.map((stamp) => (
              <Stamp key={stamp.id} stamp={stamp} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
