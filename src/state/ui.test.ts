import { describe, it, expect, beforeEach } from 'vitest';
import { useUI } from './ui';

beforeEach(() => {
  useUI.setState({ theme: 'system', font: 'lexend', drawerItemId: null });
});

describe('useUI', () => {
  it('default theme is system', () => {
    expect(useUI.getState().theme).toBe('system');
  });

  it('setTheme updates', () => {
    useUI.getState().setTheme('dark');
    expect(useUI.getState().theme).toBe('dark');
  });

  it('setFont updates', () => {
    useUI.getState().setFont('opendyslexic');
    expect(useUI.getState().font).toBe('opendyslexic');
  });

  it('drawer open/close', () => {
    useUI.getState().openDrawer('item-123');
    expect(useUI.getState().drawerItemId).toBe('item-123');
    useUI.getState().closeDrawer();
    expect(useUI.getState().drawerItemId).toBeNull();
  });
});
