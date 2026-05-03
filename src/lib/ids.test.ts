import { describe, it, expect } from 'vitest';
import { newId } from './ids';

describe('newId', () => {
  it('returns a non-empty string', () => {
    expect(newId()).toMatch(/.+/);
  });
  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
  });
});
