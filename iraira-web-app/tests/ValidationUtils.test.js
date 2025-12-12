/**
 * ValidationUtils テスト
 * Property 17: Name Length Validation（名前の長さ検証）
 * Property 18: Name Sanitization（名前のサニタイゼーション）
 */

import fc from 'fast-check';
import {
  validateNameLength,
  sanitizeName,
  validateAndSanitizeName,
  ValidationError,
  generateErrorMessage
} from '../src/ValidationUtils.js';

describe('ValidationUtils', () => {
  describe('Unit Tests', () => {
    describe('validateNameLength', () => {
      test('should accept valid length names', () => {
        expect(validateNameLength('a')).toBe(true);
        expect(validateNameLength('Player')).toBe(true);
        expect(validateNameLength('a'.repeat(20))).toBe(true);
      });

      test('should reject empty names', () => {
        expect(() => validateNameLength('')).toThrow(ValidationError);
        expect(() => validateNameLength('   ')).toThrow(ValidationError);
      });

      test('should reject names too long', () => {
        expect(() => validateNameLength('a'.repeat(21))).toThrow(ValidationError);
      });

      test('should reject non-string inputs', () => {
        expect(() => validateNameLength(null)).toThrow(ValidationError);
        expect(() => validateNameLength(123)).toThrow(ValidationError);
      });
    });

    describe('sanitizeName', () => {
      test('should keep valid characters', () => {
        expect(sanitizeName('Player123')).toBe('Player123');
        expect(sanitizeName('Player-Name_123')).toBe('Player-Name_123');
        expect(sanitizeName('Player Name')).toBe('Player Name');
      });

      test('should remove invalid characters', () => {
        expect(sanitizeName('Player<script>')).toBe('Playerscript');
        expect(sanitizeName('Player@#$%')).toBe('Player');
        expect(() => sanitizeName('プレイヤー')).toThrow(ValidationError);
      });

      test('should trim whitespace', () => {
        expect(sanitizeName('  Player  ')).toBe('Player');
      });
    });

    describe('generateErrorMessage', () => {
      test('should return ValidationError message', () => {
        const error = new ValidationError('Test error');
        expect(generateErrorMessage(error)).toBe('Test error');
      });

      test('should return generic message for other errors', () => {
        const error = new Error('Some error');
        expect(generateErrorMessage(error)).toBe('名前の検証中にエラーが発生しました。もう一度お試しください。');
      });
    });
  });

  describe('Property Tests', () => {
    const config = { numRuns: 100 };

    // **Feature: mouse-wire-game, Property 17: Name Length Validation**
    test('Property 17: Name Length Validation', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            try {
              const result = validateNameLength(input);
              // 成功した場合、入力は1-20文字の範囲内でなければならない
              const trimmed = input.trim();
              expect(trimmed.length).toBeGreaterThanOrEqual(1);
              expect(trimmed.length).toBeLessThanOrEqual(20);
              expect(result).toBe(true);
            } catch (error) {
              // 失敗した場合、ValidationErrorでなければならない
              expect(error).toBeInstanceOf(ValidationError);
              // そして入力は無効な長さでなければならない
              const trimmed = input.trim();
              expect(trimmed.length < 1 || trimmed.length > 20).toBe(true);
            }
          }
        ),
        config
      );
    });

    // **Feature: mouse-wire-game, Property 18: Name Sanitization**
    test('Property 18: Name Sanitization', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            try {
              const sanitized = sanitizeName(input);
              // サニタイズされた結果は許可された文字のみを含む必要がある
              expect(sanitized).toMatch(/^[a-zA-Z0-9 \-_]*$/);
              // 前後の空白は削除されている必要がある
              expect(sanitized).toBe(sanitized.trim());
              // 長さは1-20文字の範囲内でなければならない
              expect(sanitized.length).toBeGreaterThanOrEqual(1);
              expect(sanitized.length).toBeLessThanOrEqual(20);
            } catch (error) {
              // 失敗した場合、ValidationErrorでなければならない
              expect(error).toBeInstanceOf(ValidationError);
              // 入力をサニタイズした結果が無効な長さになった場合
              const sanitized = input.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
              expect(sanitized.length < 1 || sanitized.length > 20).toBe(true);
            }
          }
        ),
        config
      );
    });

    // 追加のプロパティテスト：統合関数のテスト
    test('Property: validateAndSanitizeName integration', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            try {
              const result = validateAndSanitizeName(input);
              // 成功した場合、結果は有効でサニタイズされた名前でなければならない
              expect(result).toMatch(/^[a-zA-Z0-9 \-_]+$/);
              expect(result.length).toBeGreaterThanOrEqual(1);
              expect(result.length).toBeLessThanOrEqual(20);
              expect(result).toBe(result.trim());
            } catch (error) {
              // 失敗した場合、ValidationErrorでなければならない
              expect(error).toBeInstanceOf(ValidationError);
            }
          }
        ),
        config
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle boundary values correctly', () => {
      // 境界値テスト
      expect(validateNameLength('a')).toBe(true); // 最小長
      expect(validateNameLength('a'.repeat(20))).toBe(true); // 最大長
      
      expect(() => validateNameLength('')).toThrow(); // 最小長未満
      expect(() => validateNameLength('a'.repeat(21))).toThrow(); // 最大長超過
    });

    test('should handle special character combinations', () => {
      expect(sanitizeName('Player_123-Name')).toBe('Player_123-Name');
      expect(sanitizeName('Player   Name')).toBe('Player   Name'); // 複数スペース保持
      expect(sanitizeName('___---___')).toBe('___---___');
    });

    test('should handle empty results after sanitization', () => {
      expect(() => sanitizeName('!@#$%^&*()')).toThrow(ValidationError);
      expect(() => sanitizeName('プレイヤー名前')).toThrow(ValidationError);
    });
  });
});