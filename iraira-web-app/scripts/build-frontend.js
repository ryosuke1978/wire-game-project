#!/usr/bin/env node

/**
 * フロントエンド用ビルドスクリプト
 * HTML、CSS、JSファイルを本番用に最適化してdistディレクトリに出力
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ディレクトリ作成
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 環境変数から API エンドポイントを取得
const apiEndpoint = process.env.API_ENDPOINT || 'https://api.iraira-game.com/dev';

console.log('🏗️  フロントエンドをビルド中...');
console.log(`📡 API Endpoint: ${apiEndpoint}`);

// HTMLファイルをコピーしてAPI エンドポイントを置換
const htmlSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const htmlWithApi = htmlSource
  .replace(/const API_ENDPOINT = '[^']*'/g, `const API_ENDPOINT = '${apiEndpoint}'`)
  .replace(/src="\.\.\/src\/index\.js"/g, 'src="index.js"');
fs.writeFileSync(path.join(distDir, 'index.html'), htmlWithApi);

// CSSファイルをコピー
const cssSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'styles.css'), 'utf8');
fs.writeFileSync(path.join(distDir, 'styles.css'), cssSource);

// JavaScriptファイルをコピー（本番用に最適化）
const srcDir = path.join(__dirname, '..', 'src');
const jsFiles = fs.readdirSync(srcDir).filter(file => file.endsWith('.js'));

jsFiles.forEach(file => {
  const jsSource = fs.readFileSync(path.join(srcDir, file), 'utf8');
  
  // 最適化を無効化（デバッグのため元のファイルをそのままコピー）
  const optimized = jsSource;
  
  fs.writeFileSync(path.join(distDir, file), optimized);
});

// package.jsonから依存関係情報を読み取り、バージョン情報を追加
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const buildInfo = {
  version: packageJson.version,
  buildTime: new Date().toISOString(),
  apiEndpoint: apiEndpoint
};

fs.writeFileSync(path.join(distDir, 'build-info.json'), JSON.stringify(buildInfo, null, 2));

console.log('✅ フロントエンドビルド完了');
console.log(`📁 出力ディレクトリ: ${distDir}`);
console.log(`📄 ファイル数: ${fs.readdirSync(distDir).length}`);