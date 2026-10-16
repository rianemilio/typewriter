import { Desk } from './components/Desk/Desk';
import { useTypewriterSound } from './hooks/useTypewriterSound';

export function App() {
  const sound = useTypewriterSound();

  return <Desk soundOn={sound.enabled} onToggleSound={sound.toggle} onSurfaceClick={() => {}} />;
}
