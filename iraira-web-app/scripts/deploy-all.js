#!/usr/bin/env node

/**
 * 統合デプロイスクリプト
 * フロントエンドとバックエンドを順次デプロイ
 */

import { execSync } from 'child_process';
import path from 'path';
import { loadEnv } from './load-env.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイルから環境変数を読み込み
loadEnv();

// 環境変数
const environment = process.env.ENVIRONMENT || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

console.log('🚀 統合デプロイを開始...');
console.log(`🌍 環境: ${environment}`);
console.log(`📍 リージョン: ${region}`);

const scriptsDir = path.join(__dirname);

try {
  // 1. バックエンドをデプロイ
  console.log('\n📦 ステップ 1: バックエンドデプロイ');
  console.log('=' .repeat(50));
  execSync(`node ${path.join(scriptsDir, 'deploy-backend.js')}`, { 
    stdio: 'inherit',
    env: { ...process.env, ENVIRONMENT: environment, AWS_REGION: region }
  });
  
  // 2. API エンドポイントを取得
  console.log('\n📡 ステップ 2: API エンドポイント取得');
  console.log('=' .repeat(50));
  const stackName = `iraira-wire-game-${environment}`;
  const getApiCommand = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${region} --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayEndpoint'].OutputValue" --output text`;
  
  const apiEndpoint = execSync(getApiCommand, { encoding: 'utf8' }).trim();
  console.log(`📡 API Endpoint: ${apiEndpoint}`);
  
  // 3. フロントエンドをビルド
  console.log('\n🏗️  ステップ 3: フロントエンドビルド');
  console.log('=' .repeat(50));
  execSync(`node ${path.join(scriptsDir, 'build-frontend.js')}`, { 
    stdio: 'inherit',
    env: { ...process.env, API_ENDPOINT: apiEndpoint }
  });
  
  // 4. S3にアップロード
  console.log('\n📤 ステップ 4: S3アップロード');
  console.log('=' .repeat(50));
  execSync(`node ${path.join(scriptsDir, 'sync-s3.js')}`, { 
    stdio: 'inherit',
    env: { ...process.env, ENVIRONMENT: environment, AWS_REGION: region }
  });
  
  // 5. CloudFront無効化（オプション）
  if (process.env.CLOUDFRONT_DISTRIBUTION_ID) {
    console.log('\n🔄 ステップ 5: CloudFront無効化');
    console.log('=' .repeat(50));
    execSync(`node ${path.join(scriptsDir, 'invalidate-cloudfront.js')}`, { 
      stdio: 'inherit',
      env: { ...process.env, ENVIRONMENT: environment }
    });
  } else {
    console.log('\n⏭️  ステップ 5: CloudFront無効化をスキップ');
    console.log('💡 CLOUDFRONT_DISTRIBUTION_ID を設定すると自動無効化されます');
  }
  
  console.log('\n🎉 統合デプロイ完了!');
  console.log('=' .repeat(50));
  console.log(`📡 API: ${apiEndpoint}`);
  
  const bucketName = process.env.S3_BUCKET || `iraira-web-game-${environment}`;
  const websiteUrl = `http://${bucketName}.s3-website-${region}.amazonaws.com`;
  console.log(`🌐 Website: ${websiteUrl}`);
  
} catch (error) {
  console.error('❌ デプロイエラー:', error.message);
  process.exit(1);
}