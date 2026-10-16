import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CarriageMotion } from '../Typewriter/machine';
import { cx } from '../../utils/cx';
import { motionMs } from '../../utils/timing';
import styles from './Carriage.module.scss';

interface CarriageProps {
  /** Horizontal offset in px */
  offset: number;
  motion: CarriageMotion;
  /** Duration of a carriage return */
  ms: number;
  /** Plays the lever pull */
  returning: boolean;
  /** The paper feed, drawn behind the roller */
  children: ReactNode;
}

function transitionFor(motion: CarriageMotion, ms: number): string {
  if (motion === 'none') return 'none';
  if (motion === 'type') return `transform ${motionMs(90)}ms ease-out`;
  return `transform ${motionMs(ms)}ms cubic-bezier(.5,0,.2,1)`;
}

export function Carriage({ offset, motion, ms, returning, children }: CarriageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const transition = transitionFor(motion, ms);

  // Commit an instant jump before any later transition starts from it
  useLayoutEffect(() => {
    if (transition === 'none') ref.current?.getBoundingClientRect();
  }, [offset, transition]);

  return (
    <div
      ref={ref}
      className={cx(styles.carriage, returning && styles.returning)}
      style={{ transform: `translateX(${offset}px)`, transition }}
    >
      {children}
      <div className={styles.bail}>
        <i className={styles.grip} />
        <i className={styles.grip} />
      </div>
      <div className={styles.lever} />
      <div className={cx(styles.knob, styles.left)} />
      <div className={cx(styles.hub, styles.left)} />
      <div className={styles.roller} />
      <div className={cx(styles.hub, styles.right)} />
      <div className={cx(styles.knob, styles.right)} />
    </div>
  );
}
