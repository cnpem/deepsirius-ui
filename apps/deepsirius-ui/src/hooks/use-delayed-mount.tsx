import { useEffect, useState } from 'react';

export const useDelayedMount = (delay: number) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMounted(true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);
  return mounted;
};
