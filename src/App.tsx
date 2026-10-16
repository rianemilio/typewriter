import { useRef } from 'react';
import { Desk } from './components/Desk/Desk';
import { Typewriter } from './components/Typewriter/Typewriter';
import type { TypewriterHandle } from './components/Typewriter/Typewriter';
import { useTypewriterSound } from './hooks/useTypewriterSound';

export function App() {
  const sound = useTypewriterSound();
  const typewriter = useRef<TypewriterHandle>(null);

  return (
    <Desk soundOn={sound.enabled} onToggleSound={sound.toggle} onSurfaceClick={() => typewriter.current?.focus()}>
      <Typewriter ref={typewriter} sound={sound.player} />
    </Desk>
  );
}
