import { create } from 'zustand';

type SwState = {
  needRefresh: boolean;
  setNeedRefresh: (v: boolean) => void;
  applyUpdate: () => void;
  setApplyUpdate: (fn: () => void) => void;
};

export const useSW = create<SwState>((set) => ({
  needRefresh: false,
  setNeedRefresh: (v) => set({ needRefresh: v }),
  applyUpdate: () => {},
  setApplyUpdate: (fn) => set({ applyUpdate: fn }),
}));
