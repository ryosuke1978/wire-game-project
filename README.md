# イライラ棒ゲーム (Wire Game)

キーボード操作によるブラウザベースのイライラ棒ゲームです。HTML5 CanvasとVanilla JavaScriptで実装され、AWS Lambda + DynamoDBバックエンドに対応しています。

## 🎮 ゲーム概要

プレイヤーはキーボードの矢印キーでキャラクターを操作し、曲線の通路を通ってスタートからゴールまで移動します。通路から外れるとゲームオーバーになる、クラシックなイライラ棒ゲームです。

## ✨ 特徴

- **4つの難易度レベル**: Easy (100px), Medium (60px), Hard (40px), Super Hard (30px)
- **曲線通路**: 動的に生成される滑らかな曲線の通路
- **リアルタイム操作**: キーを押している間だけキャラクターが移動
- **スコアシステム**: 完了時間ベースのスコア記録
- **オフライン対応**: ローカルストレージでのスコア保存
- **AWS統合**: Lambda + DynamoDB バックエンド対応

## 🎯 操作方法

- **移動**: 矢印キー（↑↓←→）またはWASDキー
- **動作**: キーを押している間だけキャラクターが移動
- **目標**: 白い円形の通路内を移動してオレンジのゴールに到達

## 🛠️ 技術スタック

### フロントエンド
- HTML5 Canvas
- Vanilla JavaScript (ES6+)
- CSS3

### バックエンド
- AWS Lambda (Node.js 18.x+)
- Amazon DynamoDB
- AWS API Gateway
- AWS S3 (静的ホスティング)

### 開発・テスト
- Jest + jsdom
- fast-check (プロパティベーステスト)
- AWS SAM CLI

## 📁 プロジェクト構造

```
wire-game-project/
├── README.md                    # このファイル
├── specs/                       # 仕様書（要件・設計・タスク）
│   ├── requirements.md         # 要件定義書
│   ├── design.md              # 設計書
│   └── tasks.md               # 実装タスク
└── iraira-web-app/            # メインアプリケーション
    ├── dist/                  # ビルド済みファイル
    │   ├── index.html        # メインHTML
    │   ├── game-final.js     # ゲームロジック
    │   └── styles.css        # スタイルシート
    ├── src/                   # ソースコード
    ├── tests/                 # テストファイル
    ├── lambda/                # AWS Lambda関数
    ├── scripts/               # デプロイスクリプト
    └── package.json           # 依存関係
```

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd iraira-web-app
npm install
```

### 2. ローカル開発

```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test

# テストカバレッジ
npm run test:coverage
```

### 3. AWS デプロイ

```bash
# 環境設定
cp .env.example .env
# .envファイルを編集してAWS設定を入力

# フロントエンドビルド
npm run build

# バックエンドデプロイ
npm run deploy:backend

# フロントエンドデプロイ
npm run deploy:frontend

# 一括デプロイ
npm run deploy:all
```

## 🎲 ゲームルール

1. **開始**: 難易度を選択してスタートボタンをクリック
2. **移動**: 矢印キーを押してキャラクターを操作
3. **通路**: 白い円形エリアが安全な通路
4. **衝突**: 通路から外れるとゲームオーバー
5. **ゴール**: オレンジ色の円に到達すればクリア
6. **スコア**: 完了時間が短いほど良いスコア

## 📊 難易度設定

| 難易度 | 通路幅 | キャラクター速度 |
|--------|--------|------------------|
| Easy | 100px | 2px/frame |
| Medium | 60px | 3px/frame |
| Hard | 40px | 4px/frame |
| Super Hard | 30px | 6px/frame |

## 🧪 テスト

プロジェクトには包括的なテストスイートが含まれています：

- **単体テスト**: 各コンポーネントの機能テスト
- **プロパティベーステスト**: fast-checkを使用した網羅的テスト
- **統合テスト**: API エンドポイントとWebインターフェースのテスト

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジレポート
npm run test:coverage
```

## 📝 仕様書

`specs/` ディレクトリには詳細な仕様書が含まれています：

- **requirements.md**: EARS形式の要件定義
- **design.md**: アーキテクチャと設計詳細
- **tasks.md**: 実装タスクリスト

## 🌐 デモ

ライブデモ: http://iraira-web-game-dev.s3-website-ap-northeast-1.amazonaws.com

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesページでお知らせください。