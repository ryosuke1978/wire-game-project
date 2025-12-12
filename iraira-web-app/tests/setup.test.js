import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';

describe('プロジェクトセットアップ / Project Setup', () => {
  test('Jestが正しく動作することを確認 / Verify Jest is working', () => {
    expect(true).toBe(true);
  });

  test('fast-checkが正しく動作することを確認 / Verify fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n; // 任意の整数は自分自身と等しい
      })
    );
  });

  test('基本的な算術プロパティテスト / Basic arithmetic property test', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // 加算の交換法則
      }),
      { numRuns: 100 }
    );
  });
});
