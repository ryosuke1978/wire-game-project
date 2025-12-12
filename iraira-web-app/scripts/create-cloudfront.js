#!/usr/bin/env node

/**
 * CloudFrontディストリビューション作成スクリプト
 * S3静的サイト用のCloudFrontディストリビューションを作成
 */

import { execSync } from 'child_process';
import fs from 'fs';

// 環境変数
const bucketName = process.env.S3_BUCKET || 'iraira-web-game-dev';
const environment = process.env.ENVIRONMENT || 'dev';

console.log('🚀 CloudFrontディストリビューション作成を開始...');
console.log(`📦 S3バケット: ${bucketName}`);

// CloudFront設定を読み込み
const configPath = './cloudfront-config.json';
if (!fs.existsSync(configPath)) {
  console.error('❌ cloudfront-config.json が見つかりません');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

try {
  console.log('📋 CloudFrontディストリビューション作成中...');
  
  // ディストリビューション作成コマンド
  const createCommand = [
    'aws cloudfront create-distribution',
    '--distribution-config', `'${JSON.stringify(config)}'`,
    '--query "Distribution.{Id:Id,DomainName:DomainName,Status:Status}"',
    '--output table'
  ].join(' ');
  
  console.log('⏳ 作成中... (15-20分かかります)');
  execSync(createCommand, { stdio: 'inherit' });
  
  console.log('✅ CloudFrontディストリビューション作成完了');
  console.log('');
  console.log('📝 次のステップ:');
  console.log('1. ディストリビューションIDを.envファイルのCLOUDFRONT_DISTRIBUTION_IDに設定');
  console.log('2. デプロイ完了まで15-20分待機');
  console.log('3. https://[distribution-id].cloudfront.net でアクセス確認');
  
} catch (error) {
  console.error('❌ CloudFront作成エラー:', error.message);
  console.log('');
  console.log('💡 手動作成の場合:');
  console.log('1. AWS Management Console > CloudFront');
  console.log('2. Create Distribution');
  console.log(`3. Origin: ${bucketName}.s3-website-ap-northeast-1.amazonaws.com`);
  console.log('4. Viewer Protocol Policy: Redirect HTTP to HTTPS');
  process.exit(1);
}