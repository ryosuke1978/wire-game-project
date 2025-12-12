#!/usr/bin/env node

/**
 * 環境変数読み込みスクリプト
 * .envファイルから環境変数を読み込んでプロセスに設定
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .envファイルが見つかりません');
    console.log('💡 .env.exampleをコピーして.envファイルを作成してください');
    return false;
  }
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      
      // コメント行や空行をスキップ
      if (line.startsWith('#') || line === '') {
        return;
      }
      
      // KEY=VALUE形式をパース
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 1).trim();
        
        // クォートを削除
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        // 環境変数に設定
        process.env[key] = cleanValue;
        
        // AWS認証情報は表示しない
        if (key.includes('SECRET') || key.includes('KEY')) {
          console.log(`✅ ${key}=***`);
        } else {
          console.log(`✅ ${key}=${cleanValue}`);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ .envファイル読み込みエラー:', error.message);
    return false;
  }
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📁 環境変数を読み込み中...');
  const success = loadEnv();
  
  if (success) {
    console.log('✅ 環境変数の読み込み完了');
    
    // AWS認証情報の確認
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('🔑 AWS認証情報が設定されています');
    } else {
      console.log('⚠️  AWS認証情報が不完全です');
      console.log('💡 .envファイルでAWS_ACCESS_KEY_IDとAWS_SECRET_ACCESS_KEYを設定してください');
    }
  } else {
    process.exit(1);
  }
}

export { loadEnv };