#!/usr/bin/env node

/**
 * Windows用セットアップスクリプト
 * Node.jsで実行するため、PowerShellの実行ポリシーに依存しない
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Windows環境セットアップを開始...');

// .envファイルの確認と作成
function setupEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('📁 .envファイルを作成中...');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .envファイルを作成しました');
    } else {
      // .env.exampleが存在しない場合、デフォルトの内容を作成
      const defaultEnv = `# AWS認証情報（実際の値に置き換えてください）
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_DEFAULT_REGION=ap-northeast-1

# デプロイ設定
ENVIRONMENT=dev
S3_BUCKET=iraira-web-game-dev

# オプション設定
# CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC`;
      
      fs.writeFileSync(envPath, defaultEnv);
      console.log('✅ .envファイルを作成しました');
    }
    
    console.log('⚠️  .envファイルを編集してAWS認証情報を設定してください');
    console.log('');
    console.log('必要な設定項目:');
    console.log('  AWS_ACCESS_KEY_ID=your-access-key-id');
    console.log('  AWS_SECRET_ACCESS_KEY=your-secret-access-key');
    console.log('  AWS_DEFAULT_REGION=ap-northeast-1');
    console.log('');
  } else {
    console.log('✅ .envファイルが存在します');
  }
}

// 必要なツールの確認
function checkRequiredTools() {
  const tools = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'AWS CLI', command: 'aws --version' },
    { name: 'SAM CLI', command: 'sam --version' }
  ];
  
  console.log('🔍 必要なツールを確認中...');
  
  for (const tool of tools) {
    try {
      const version = execSync(tool.command, { encoding: 'utf8', stdio: 'pipe' }).trim();
      console.log(`✅ ${tool.name}: ${version.split('\n')[0]}`);
    } catch (error) {
      console.log(`❌ ${tool.name}がインストールされていません`);
      
      // インストール手順を表示
      switch (tool.name) {
        case 'Node.js':
          console.log('💡 https://nodejs.org/ からNode.js 18.x以上をインストールしてください');
          break;
        case 'AWS CLI':
          console.log('💡 https://aws.amazon.com/cli/ からAWS CLI v2をインストールしてください');
          break;
        case 'SAM CLI':
          console.log('💡 https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html からSAM CLIをインストールしてください');
          break;
      }
      
      if (tool.name === 'Node.js' || tool.name === 'npm') {
        console.log('❌ Node.jsが必要です。セットアップを中止します。');
        process.exit(1);
      }
    }
  }
}

// 依存関係のインストール
function installDependencies() {
  console.log('📦 依存関係をインストール中...');
  
  try {
    // ルートディレクトリの依存関係
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ ルート依存関係のインストール完了');
    
    // Lambda依存関係
    const lambdaDir = path.join(__dirname, '..', 'lambda');
    if (fs.existsSync(lambdaDir)) {
      console.log('📦 Lambda依存関係をインストール中...');
      execSync('npm install', { cwd: lambdaDir, stdio: 'inherit' });
      console.log('✅ Lambda依存関係のインストール完了');
    }
  } catch (error) {
    console.log('❌ 依存関係のインストールでエラーが発生しました:', error.message);
    console.log('💡 手動で npm install を実行してください');
  }
}

// 環境変数の確認
async function checkEnvironmentVariables() {
  console.log('🔧 環境変数を確認中...');
  
  try {
    const { loadEnv } = await import('./load-env.js');
    loadEnv();
    
    // AWS認証情報の確認
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      if (process.env.AWS_ACCESS_KEY_ID.includes('your-access-key')) {
        console.log('⚠️  .envファイルのAWS認証情報を実際の値に更新してください');
      } else {
        console.log('🔑 AWS認証情報が設定されています');
      }
    } else {
      console.log('⚠️  AWS認証情報が不完全です');
      console.log('💡 .envファイルでAWS_ACCESS_KEY_IDとAWS_SECRET_ACCESS_KEYを設定してください');
    }
  } catch (error) {
    console.log('⚠️  環境変数の確認でエラーが発生しました:', error.message);
  }
}

// メイン処理
async function main() {
  try {
    setupEnvFile();
    checkRequiredTools();
    installDependencies();
    await checkEnvironmentVariables();
    
    console.log('');
    console.log('🎉 セットアップ完了!');
    console.log('');
    console.log('次のステップ:');
    console.log('1. .envファイルを編集してAWS認証情報を設定');
    console.log('2. 環境変数を確認: npm run env:load');
    console.log('3. AWS認証テスト: aws sts get-caller-identity');
    console.log('4. デプロイを実行: npm run deploy:all');
    console.log('');
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error.message);
    process.exit(1);
  }
}

// 実行
main();