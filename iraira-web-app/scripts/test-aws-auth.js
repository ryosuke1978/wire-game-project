#!/usr/bin/env node

/**
 * AWS認証テストスクリプト
 */

import { execSync } from 'child_process';
import { loadEnv } from './load-env.js';

console.log('🔐 AWS認証情報をテスト中...');

// .envファイルから環境変数を読み込み
loadEnv();

// 環境変数を確認
console.log('📋 設定された環境変数:');
console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '設定済み' : '未設定'}`);
console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定'}`);
console.log(`AWS_DEFAULT_REGION: ${process.env.AWS_DEFAULT_REGION || '未設定'}`);

// AWS CLIで認証テスト
try {
  console.log('\n🧪 AWS認証をテスト中...');
  
  const result = execSync('aws sts get-caller-identity', {
    encoding: 'utf8',
    env: {
      ...process.env,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION
    }
  });
  
  console.log('✅ AWS認証成功!');
  console.log('📋 認証情報:');
  console.log(result);
  
} catch (error) {
  console.log('❌ AWS認証失敗');
  console.log('エラー:', error.message);
  console.log('\n💡 解決方法:');
  console.log('1. .envファイルのAWS認証情報を確認');
  console.log('2. IAMユーザーのアクセスキーが有効か確認');
  console.log('3. 必要な権限が付与されているか確認');
}