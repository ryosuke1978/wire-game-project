#!/usr/bin/env node

/**
 * CloudFront無効化スクリプト
 * CloudFrontキャッシュを無効化してファイル更新を反映
 */

import { execSync } from 'child_process';

// 環境変数
const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const environment = process.env.ENVIRONMENT || 'dev';

console.log('🔄 CloudFront無効化を開始...');

if (!distributionId) {
  console.log('⚠️  CLOUDFRONT_DISTRIBUTION_ID が設定されていません');
  console.log('📋 利用可能なディストリビューションを検索中...');
  
  try {
    // ディストリビューション一覧を取得
    const listCommand = 'aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,Comment,Status]" --output table';
    execSync(listCommand, { stdio: 'inherit' });
    
    console.log('💡 使用方法:');
    console.log('   CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC npm run invalidate');
    process.exit(1);
  } catch (error) {
    console.error('❌ ディストリビューション取得エラー:', error.message);
    process.exit(1);
  }
}

console.log(`🆔 ディストリビューションID: ${distributionId}`);

try {
  // 無効化を作成
  console.log('🗑️  キャッシュ無効化を実行中...');
  const invalidationCommand = [
    'aws cloudfront create-invalidation',
    '--distribution-id', distributionId,
    '--paths "/*"',
    '--query "Invalidation.Id"',
    '--output text'
  ].join(' ');
  
  const invalidationId = execSync(invalidationCommand, { encoding: 'utf8' }).trim();
  console.log(`📝 無効化ID: ${invalidationId}`);
  
  // 無効化の進行状況を監視
  console.log('⏳ 無効化の完了を待機中...');
  const waitCommand = [
    'aws cloudfront wait invalidation-completed',
    '--distribution-id', distributionId,
    '--id', invalidationId
  ].join(' ');
  
  execSync(waitCommand, { stdio: 'inherit' });
  
  console.log('✅ CloudFront無効化完了');
  
  // ディストリビューション情報を表示
  console.log('📋 ディストリビューション情報:');
  const infoCommand = [
    'aws cloudfront get-distribution',
    '--id', distributionId,
    '--query "Distribution.{DomainName:DomainName,Status:Status,LastModifiedTime:LastModifiedTime}"',
    '--output table'
  ].join(' ');
  
  execSync(infoCommand, { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ CloudFront無効化エラー:', error.message);
  process.exit(1);
}