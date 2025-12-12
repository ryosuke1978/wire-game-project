#!/usr/bin/env node

/**
 * S3オブジェクトにキャッシュ無効化ヘッダーを設定
 */

import { execSync } from 'child_process';

const bucketName = process.env.S3_BUCKET || 'iraira-web-game-dev';

console.log('🚫 S3オブジェクトのキャッシュ設定を無効化中...');

try {
  // HTMLファイルの適切なキャッシュ設定
  console.log('📄 HTMLファイルのキャッシュ設定...');
  execSync(`aws s3 cp s3://${bucketName}/index.html s3://${bucketName}/index.html --metadata-directive REPLACE --cache-control "max-age=0" --content-type "text/html"`, { stdio: 'inherit' });
  
  // JavaScriptファイルの適切なキャッシュ設定
  console.log('📜 JavaScriptファイルのキャッシュ設定...');
  execSync(`aws s3 cp s3://${bucketName}/game-final.js s3://${bucketName}/game-final.js --metadata-directive REPLACE --cache-control "max-age=0" --content-type "application/javascript"`, { stdio: 'inherit' });
  
  // CSSファイルの適切なキャッシュ設定
  console.log('🎨 CSSファイルのキャッシュ設定...');
  execSync(`aws s3 cp s3://${bucketName}/styles.css s3://${bucketName}/styles.css --metadata-directive REPLACE --cache-control "max-age=0" --content-type "text/css"`, { stdio: 'inherit' });
  
  console.log('✅ キャッシュ無効化設定完了');
  console.log('🌐 ブラウザでCtrl+F5（強制リロード）を実行してください');
  
} catch (error) {
  console.error('❌ キャッシュ設定エラー:', error.message);
  process.exit(1);
}