import type { CSSProperties } from 'react';

export type Field = 'login' | 'password';

export type Phase =
  | 'intro'
  | 'typingLogin'
  | 'typingPassword'
  | 'validating'
  | 'denied'
  | 'granted'
  | 'ejecting';

/** One typebar impression. Ink variation is rolled once, when the character is created. */
export interface InkChar {
  id: number;
  char: string;
  /** Vertical offset in px */
  dy: number;
  /** Tilt in degrees */
  rotation: number;
  opacity: number;
  /** Queued characters keep their space on the line but stay invisible until struck. */
  struck: boolean;
}

export type LineKind = 'title' | 'rule' | 'text';

export interface PaperLine {
  id: number;
  kind: LineKind;
  chars: InkChar[];
}

export type StampKind = 'denied' | 'granted';

export interface StampMark {
  id: number;
  kind: StampKind;
  /** Distance from the top of the sheet, in px */
  top: number;
  /** Horizontal offset from the sheet's center, in px */
  offsetX: number;
  /** Tilt in degrees */
  rotation: number;
}

/** Inline style that also accepts CSS custom properties. */
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>;
