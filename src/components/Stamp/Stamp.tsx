import type { CSSVars, StampMark } from '../../types';
import { cx } from '../../utils/cx';
import styles from './Stamp.module.scss';

const LABEL = { denied: 'DENIED', granted: 'ACCESS GRANTED' };

export function Stamp({ stamp }: { stamp: StampMark }) {
  const style: CSSVars = {
    '--rot': `${stamp.rotation}deg`,
    top: `${stamp.top}px`,
    left: `calc(50% + ${stamp.offsetX}px)`,
  };
  return (
    <div className={cx(styles.stamp, styles[stamp.kind])} style={style}>
      {LABEL[stamp.kind]}
    </div>
  );
}
