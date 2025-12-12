#!/usr/bin/env node

/**
 * S3同期スクリプト
 * フロントエンドファイルをS3バケットにアップロード
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数
const environment = process.env.ENVIRONMENT || 'dev';
const bucketName = process.env.S3_BUCKET || `iraira-web-game-${environment}`;
const region = process.env.AWS_REGION || 'ap-northeast-1';

console.log('📤 S3同期を開始...');
console.log(`🪣 バケット: ${bucketName}`);
console.log(`📍 リージョン: ${region}`);

const distDir = path.join(__dirname, '..', 'dist');

try {
  // バケットが存在するかチェック
  console.log('🔍 S3バケットの存在確認...');
  try {
    execSync(`aws s3 ls s3://${bucketName} --region ${region}`, { stdio: 'pipe' });
    console.log('✅ バケットが見つかりました');
  } catch (error) {
    console.log('🆕 バケットを作成中...');
    execSync(`aws s3 mb s3://${bucketName} --region ${region}`, { stdio: 'inherit' });
    
    // 静的ウェブサイトホスティングを有効化
    console.log('🌐 静的ウェブサイトホスティングを設定中...');
    const websiteConfig = {
      IndexDocument: { Suffix: 'index.html' },
      ErrorDocument: { Key: 'index.html' }
    };
    
    execSync(`aws s3api put-bucket-website --bucket ${bucketName} --website-configuration '${JSON.stringify(websiteConfig)}' --region ${region}`, { stdio: 'inherit' });
    
    // パブリック読み取りポリシーを設定
    console.log('🔓 バケットポリシーを設定中...');
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [{
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`
      }]
    };
    
    execSync(`aws s3api put-bucket-policy --bucket ${bucketName} --policy '${JSON.stringify(bucketPolicy)}' --region ${region}`, { stdio: 'inherit' });
  }
  
  // CORS設定（PowerShellでの問題を回避するため一時的にスキップ）
  console.log('🔗 CORS設定をスキップ（手動設定が必要）...');
  
  // ファイルを同期
  console.log('📁 ファイルを同期中...');
  const syncCommand = [
    'aws s3 sync',
    distDir,
    `s3://${bucketName}`,
    '--region', region,
    '--delete',
    '--cache-control "public, max-age=31536000"',
    '--exclude "*.html"'
  ].join(' ');
  
  execSync(syncCommand, { stdio: 'inherit' });
  
  // HTMLファイルは別途キャッシュ設定
  console.log('📄 HTMLファイルをアップロード中...');
  const htmlCommand = [
    'aws s3 sync',
    distDir,
    `s3://${bucketName}`,
    '--region', region,
    '--cache-control "public, max-age=0, must-revalidate"',
    '--include "*.html"'
  ].join(' ');
  
  execSync(htmlCommand, { stdio: 'inherit' });
  
  console.log('✅ S3同期完了');
  
  // ウェブサイトURLを表示
  const websiteUrl = `http://${bucketName}.s3-website-${region}.amazonaws.com`;
  console.log(`🌐 ウェブサイトURL: ${websiteUrl}`);
  
} catch (error) {
  console.error('❌ S3同期エラー:', error.message);
  process.exit(1);
}