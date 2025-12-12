/**
 * 名前検証とサニタイゼーションのユーティリティ関数
 * Requirements: 8.2, 8.3
 */

/**
 * ValidationError - 検証エラー用のカスタムエラークラス
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 名前の長さを検証する
 * Requirements 8.2: 名前が1文字以上20文字以下であることを検証
 * 
 * @param {string} name - 検証する名前
 * @returns {boolean} - 有効な長さの場合true
 * @throws {ValidationError} - 無効な長さの場合
 */
export function validateNameLength(name) {
  if (typeof name !== 'string') {
    throw new ValidationError('名前は文字列である必要があります');
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 1) {
    throw new ValidationError('名前は1文字以上である必要があります');
  }
  
  if (trimmedName.length > 20) {
    throw new ValidationError('名前は20文字以下である必要があります');
  }
  
  return true;
}

/**
 * 名前をサニタイズする
 * Requirements 8.3: 英数字、スペース、ハイフン、アンダースコアのみを許可
 * 
 * @param {string} name - サニタイズする名前
 * @returns {string} - サニタイズされた名前
 * @throws {ValidationError} - 無効な入力の場合
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') {
    throw new ValidationError('名前は文字列である必要があります');
  }
  
  // 英数字、スペース、ハイフン、アンダースコア以外の文字を削除
  const sanitized = name.replace(/[^a-zA-Z0-9 \-_]/g, '');
  
  // 前後の空白を削除
  const trimmed = sanitized.trim();
  
  // 長さを検証
  validateNameLength(trimmed);
  
  return trimmed;
}

/**
 * エラーメッセージを生成する
 * 
 * @param {Error} error - エラーオブジェクト
 * @returns {string} - ユーザーフレンドリーなエラーメッセージ
 */
export function generateErrorMessage(error) {
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  // 予期しないエラーの場合は汎用メッセージを返す
  return '名前の検証中にエラーが発生しました。もう一度お試しください。';
}

/**
 * 名前を完全に検証・サニタイズする統合関数
 * 
 * @param {string} name - 検証・サニタイズする名前
 * @returns {string} - 検証済みでサニタイズされた名前
 * @throws {ValidationError} - 検証に失敗した場合
 */
export function validateAndSanitizeName(name) {
  try {
    const sanitized = sanitizeName(name);
    validateNameLength(sanitized);
    return sanitized;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('名前の処理中にエラーが発生しました');
  }
}