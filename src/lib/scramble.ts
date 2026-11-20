import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './scroll';

const GLYPHS = '!<>-_\\/[]{}=+*^?#01';

/** Devuelve `text` "descifrándose" cada vez que cambia. */
export function useScramble(text: string, duration = 520): string {
  const [out, setOut] = useState(text);
  const first = useRef(true);
  useEffect(() => {
    if (first.current || prefersReducedMotion()) {
      first.current = false;
      setOut(text);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const solid = Math.floor(p * text.length);
      let s = text.slice(0, solid);
      for (let i = solid; i < text.length; i++) {
        s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setOut(s);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);
  return out;
}
