import type { MouseEvent, ReactNode } from 'react';
import styles from './Desk.module.scss';

interface DeskProps {
  soundOn: boolean;
  onToggleSound(): void;
  /** Clicking anywhere on the desk (except buttons) */
  onSurfaceClick(): void;
  children?: ReactNode;
}

export function Desk({ soundOn, onToggleSound, onSurfaceClick, children }: DeskProps) {
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as Element).closest('button')) return;
    onSurfaceClick();
  };

  return (
    <main className={styles.desk} onClick={handleClick}>
      <h1 className="sr-only">Access form</h1>

      <aside className={styles.card}>
        <p className={styles.cardHead}>Test credentials</p>
        <p>
          login: <b>typist</b>
        </p>
        <p>
          password: <b>carbon</b>
        </p>
      </aside>

      <button className={styles.sound} type="button" aria-pressed={soundOn} onClick={onToggleSound}>
        {soundOn ? 'Sound on' : 'Sound off'}
      </button>

      {children}
    </main>
  );
}
