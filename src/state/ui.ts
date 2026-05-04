import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Font = 'lexend' | 'opendyslexic';

type UIState = {
  theme: Theme;
  font: Font;
  drawerItemId: string | null;
  setTheme: (t: Theme) => void;
  setFont: (f: Font) => void;
  openDrawer: (itemId: string) => void;
  closeDrawer: () => void;
};

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      font: 'lexend',
      drawerItemId: null,
      setTheme: (t) => set({ theme: t }),
      setFont: (f) => set({ font: f }),
      openDrawer: (itemId) => set({ drawerItemId: itemId }),
      closeDrawer: () => set({ drawerItemId: null }),
    }),
    { name: 'tpm-ui', partialize: (s) => ({ theme: s.theme, font: s.font }) },
  ),
);
