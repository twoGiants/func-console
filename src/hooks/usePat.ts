import { useState } from 'react';

const SESSION_KEY = 'func-console-gh-pat';

export function usePat(): { pat: string; setPat: (value: string) => void; clearPat: () => void } {
  const [pat, setPatState] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? '');

  const setPat = (value: string) => {
    sessionStorage.setItem(SESSION_KEY, value);
    setPatState(value);
  };

  const clearPat = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setPatState('');
  };

  return { pat, setPat, clearPat };
}
