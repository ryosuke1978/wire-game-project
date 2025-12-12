# イライラ棒ゲーム / Wire Game

キーボードの矢印キーで操作するイライラ棒ゲームのWebアプリケーション。

A keyboard-controlled wire game web application.

## プロジェクト構造 / Project Structure

```
iraira-web-app/
├── public/              # 静的ファイル / Static files
│   ├── index.html      # メインHTMLファイル / Main HTML file
│   └── styles.css      # スタイルシート / Stylesheet
├── src/                # ゲームソースコード / Game source code
├── tests/              # フロントエンドテスト / Frontend tests
├── lambda/             # Lambda関数 / Lambda functions
│   └── tests/          # Lambda関数テスト / Lambda function tests
├── package.json        # プロジェクト設定 / Project configuration
├── jest.config.js      # Jestテスト設定 / Jest test configuration
└── .babelrc           # Babel設定 / Babel configuration
```

## セットアップ / Setup

```bash
cd iraira-web-app
npm install
```

## 開発 / Development

```bash
npm run dev
```

## テスト / Testing

```bash
# すべてのテストを実行 / Run all tests
npm test

# テストをウォッチモードで実行 / Run tests in watch mode
npm run test:watch

# カバレッジレポートを生成 / Generate coverage report
npm run test:coverage
```

## 技術スタック / Technology Stack

- **フロントエンド / Frontend**: HTML5 Canvas, Vanilla JavaScript (ES6+), CSS3
- **バックエンド / Backend**: AWS Lambda (Node.js), API Gateway, DynamoDB
- **テスト / Testing**: Jest, fast-check (property-based testing)
- **ホスティング / Hosting**: Amazon S3, CloudFront

## 難易度レベル / Difficulty Levels

- **イージー / Easy**: 通路幅 100px, 速度 2px/frame
- **ミディアム / Medium**: 通路幅 60px, 速度 3px/frame
- **ハード / Hard**: 通路幅 40px, 速度 4px/frame
- **スーパーハード / Super Hard**: 通路幅 30px, 速度 6px/frame

## ライセンス / License

MIT
