#!/usr/bin/env node

/**
 * デプロイメントテストスクリプト
 * デプロイされたAPIエンドポイントの動作確認
 */

import https from 'https';
import http from 'http';

// 環境変数
const apiEndpoint = process.env.API_ENDPOINT;
const environment = process.env.ENVIRONMENT || 'dev';

if (!apiEndpoint) {
  console.error('❌ API_ENDPOINT環境変数が設定されていません');
  process.exit(1);
}

console.log('🧪 デプロイメントテストを開始...');
console.log(`🌍 環境: ${environment}`);
console.log(`📡 API: ${apiEndpoint}`);

// HTTPリクエスト関数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// テスト関数
async function runTests() {
  const tests = [];
  
  // 1. リーダーボードAPI テスト
  tests.push(async () => {
    console.log('📊 リーダーボードAPIテスト...');
    try {
      const response = await makeRequest(`${apiEndpoint}/leaderboard?difficulty=easy&limit=5`);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        console.log(`✅ リーダーボード取得成功 (${data.length}件)`);
        return true;
      } else {
        console.log(`⚠️  リーダーボード: ${response.statusCode} - ${response.body}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ リーダーボードエラー: ${error.message}`);
      return false;
    }
  });
  
  // 2. スコア送信API テスト
  tests.push(async () => {
    console.log('📤 スコア送信APIテスト...');
    try {
      const testScore = {
        playerName: 'TestPlayer',
        score: 12345,
        difficulty: 'easy'
      };
      
      const response = await makeRequest(`${apiEndpoint}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testScore)
      });
      
      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log('✅ スコア送信成功');
        return true;
      } else {
        console.log(`⚠️  スコア送信: ${response.statusCode} - ${response.body}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ スコア送信エラー: ${error.message}`);
      return false;
    }
  });
  
  // 3. プレイヤー履歴API テスト
  tests.push(async () => {
    console.log('📜 プレイヤー履歴APIテスト...');
    try {
      const response = await makeRequest(`${apiEndpoint}/history?playerName=TestPlayer`);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        console.log(`✅ プレイヤー履歴取得成功 (${data.length}件)`);
        return true;
      } else {
        console.log(`⚠️  プレイヤー履歴: ${response.statusCode} - ${response.body}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ プレイヤー履歴エラー: ${error.message}`);
      return false;
    }
  });
  
  // 4. CORS テスト
  tests.push(async () => {
    console.log('🔗 CORSテスト...');
    try {
      const response = await makeRequest(`${apiEndpoint}/leaderboard`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeaders = response.headers['access-control-allow-origin'];
      if (corsHeaders) {
        console.log('✅ CORS設定確認');
        return true;
      } else {
        console.log('⚠️  CORS設定が見つかりません');
        return false;
      }
    } catch (error) {
      console.log(`❌ CORSテストエラー: ${error.message}`);
      return false;
    }
  });
  
  // テスト実行
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ テスト実行エラー: ${error.message}`);
      failed++;
    }
    
    // テスト間の待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 結果表示
  console.log('\n📋 テスト結果');
  console.log('=' .repeat(30));
  console.log(`✅ 成功: ${passed}`);
  console.log(`❌ 失敗: ${failed}`);
  console.log(`📊 成功率: ${Math.round(passed / (passed + failed) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 すべてのテストが成功しました！');
    process.exit(0);
  } else {
    console.log('\n⚠️  一部のテストが失敗しました');
    process.exit(1);
  }
}

// テスト実行
runTests().catch(error => {
  console.error('❌ テスト実行エラー:', error);
  process.exit(1);
});