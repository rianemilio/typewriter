import { useCallback, useReducer, useRef, useState } from 'react';
import { createInitialState, reducer } from './machine';
import type { Action } from './machine';

/**
 * useReducer plus a synchronously updated mirror of the state, so async
 * sequences and event handlers can read the result of an action right after
 * sending it, without waiting for a render.
 */
export function useMachine() {
  const [initial] = useState(createInitialState);
  const [state, dispatch] = useReducer(reducer, initial);
  const latest = useRef(initial);

  const send = useCallback((action: Action) => {
    latest.current = reducer(latest.current, action);
    dispatch(action);
  }, []);

  const current = useCallback(() => latest.current, []);

  return [state, send, current] as const;
}
