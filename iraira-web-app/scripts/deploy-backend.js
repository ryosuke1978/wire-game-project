#!/usr/bin/env node

/**
 * SAMビルドとデプロイスクリプト
 * Lambda関数とAWSインフラをデプロイ
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
const stackName = `iraira-wire-game-${environment}`;

console.log('🚀 SAMデプロイを開始...');
console.log(`🌍 環境: ${environment}`);
console.log(`📍 リージョン: ${region}`);
console.log(`📦 スタック名: ${stackName}`);

const lambdaDir = path.join(__dirname, '..', 'lambda');

try {
  // Lambda ディレクトリに移動
  process.chdir(lambdaDir);
  
  console.log('🔨 SAM build を実行中...');
  execSync('sam build', { stdio: 'inherit' });
  
  console.log('📤 SAM deploy を実行中...');
  const deployCommand = [
    'sam deploy',
    '--stack-name', stackName,
    '--region', region,
    '--capabilities CAPABILITY_IAM',
    '--parameter-overrides',
    `Environment=${environment}`,
    '--no-confirm-changeset',
    '--no-fail-on-empty-changeset'
  ].join(' ');
  
  execSync(deployCommand, { stdio: 'inherit' });
  
  console.log('✅ バックエンドデプロイ完了');
  
  // スタック出力を取得
  console.log('📋 スタック出力を取得中...');
  const describeCommand = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${region} --query "Stacks[0].Outputs" --output table`;
  execSync(describeCommand, { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ デプロイエラー:', error.message);
  process.exit(1);
}