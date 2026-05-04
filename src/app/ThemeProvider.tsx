import { useEffect, type ReactNode } from 'react';
import { useUI, type Theme } from '../state/ui';

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUI((s) => s.theme);
  const font = useUI((s) => s.font);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme);
      const root = document.documentElement;
      root.classList.toggle('dark', resolved === 'dark');
      root.classList.toggle('font-dyslexic', font === 'opendyslexic');
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme, font]);

  return <>{children}</>;
}
