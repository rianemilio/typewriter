import { useState } from 'react';
import { Desk } from './components/Desk/Desk';

export function App() {
  const [soundOn, setSoundOn] = useState(true);

  return <Desk soundOn={soundOn} onToggleSound={() => setSoundOn((on) => !on)} onSurfaceClick={() => {}} />;
}
