import { cx } from '../../utils/cx';
import styles from './ReturnKey.module.scss';

interface ReturnKeyProps {
  label: string;
  /** Shows the key held down, e.g. when Enter is pressed on the keyboard */
  pressed: boolean;
  onPress(): void;
}

export function ReturnKey({ label, pressed, onPress }: ReturnKeyProps) {
  return (
    <button
      type="button"
      className={cx(styles.key, pressed && styles.pressed)}
      // keep focus on the hidden input while clicking
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
    >
      <span className={styles.cap}>{label}</span>
    </button>
  );
}
