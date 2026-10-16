import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { Field } from '../types';

const BLOCKED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

interface Options {
  /** Field currently accepting keystrokes, or null while the machine is busy */
  field: Field | null;
  /** What the input should contain right now */
  value: string;
  /** Last field that was opened; sets the input type and label */
  kind: Field;
  /** Receives the raw input text and returns what the input should keep */
  onInput(raw: string): string;
  onEnter(): void;
}

/**
 * An invisible text input that receives every keystroke (including from mobile
 * on-screen keyboards). The caret is pinned to the end: the typewriter can only
 * type forward and backspace.
 */
export function useHiddenInput({ field, value, kind, onInput, onEnter }: Options) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const keepCaretAtEnd = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const end = el.value.length;
    try {
      el.setSelectionRange(end, end);
    } catch {
      // type="password" in some browsers doesn't support selection APIs
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wanted = field ? value : '';
    if (el.value !== wanted) el.value = wanted;
  }, [field, value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('select', keepCaretAtEnd);
    el.addEventListener('click', keepCaretAtEnd);
    return () => {
      el.removeEventListener('select', keepCaretAtEnd);
      el.removeEventListener('click', keepCaretAtEnd);
    };
  }, [keepCaretAtEnd]);

  const focus = useCallback(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  /** Automatic focus must not steal it from a button the user tabbed to. */
  const focusUnlessOnButton = useCallback(() => {
    if (!(document.activeElement instanceof HTMLButtonElement)) focus();
  }, [focus]);

  const inputProps = {
    ref,
    type: kind === 'password' ? 'password' : 'text',
    'aria-label': kind === 'password' ? 'Password' : 'Login',
    autoComplete: 'off',
    autoCapitalize: 'off',
    autoCorrect: 'off',
    spellCheck: false,
    enterKeyHint: 'enter' as const,
    onChange(e: ChangeEvent<HTMLInputElement>) {
      const el = e.currentTarget;
      el.value = onInput(el.value);
    },
    onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter();
      } else if (BLOCKED_KEYS.has(e.key)) {
        e.preventDefault();
      }
    },
    onFocus() {
      setFocused(true);
      keepCaretAtEnd();
    },
    onBlur() {
      setFocused(false);
    },
  };

  return { inputProps, focused, focus, focusUnlessOnButton };
}
