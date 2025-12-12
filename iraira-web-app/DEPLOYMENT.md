# デプロイメントガイド

このドキュメントでは、イライラ棒ゲームのAWSへのデプロイ手順を説明します。

## 前提条件

### 必要なツール
- Node.js 18.x以上
- AWS CLI v2
- AWS SAM CLI
- 適切なAWS認証情報の設定

### AWS認証情報の設定

#### 方法1: .envファイル（推奨）
```bash
# .envファイルを編集
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_DEFAULT_REGION=ap-northeast-1
```

#### 方法2: AWS CLI設定
```bash
aws configure
```

#### 方法3: 環境変数（Windows PowerShell）
```powershell
$env:AWS_ACCESS_KEY_ID="your-access-key"
$env:AWS_SECRET_ACCESS_KEY="your-secret-key"
$env:AWS_DEFAULT_REGION="ap-northeast-1"
```

## Windows用クイックセットアップ

```powershell
# PowerShellで実行
npm run setup:windows
```

このコマンドで以下が自動実行されます：
- .envファイルの作成
- 必要なツールの確認
- 依存関係のインストール
- 環境変数の確認

## デプロイ方法

### 1. 統合デプロイ（推奨）
すべてのコンポーネントを一度にデプロイ:
```bash
npm run deploy:all
```

環境を指定する場合:
```bash
ENVIRONMENT=prod AWS_REGION=ap-northeast-1 npm run deploy:all
```

### 2. 個別デプロイ

#### バックエンドのみデプロイ
```bash
npm run deploy:backend
```

#### フロントエンドのみデプロイ
```bash
# API エンドポイントを指定
API_ENDPOINT=https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/dev npm run deploy:frontend
```

#### CloudFront無効化
```bash
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC npm run invalidate
```

## 環境変数

### 必須環境変数
- `AWS_REGION`: AWSリージョン（デフォルト: ap-northeast-1）
- `ENVIRONMENT`: 環境名（dev/prod、デフォルト: dev）

### オプション環境変数
- `S3_BUCKET`: S3バケット名（デフォルト: iraira-web-game-{environment}）
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFrontディストリビューションID
- `API_ENDPOINT`: APIエンドポイントURL

## デプロイされるリソース

### AWS Lambda関数
- `iraira-submit-score-{environment}`: スコア送信
- `iraira-get-leaderboard-{environment}`: リーダーボード取得
- `iraira-get-player-history-{environment}`: プレイヤー履歴取得

### DynamoDB
- `wire-game-scores-{environment}`: スコアテーブル
  - プライマリキー: difficulty (HASH), timestamp (RANGE)
  - GSI: PlayerIndex (playerName, timestamp)

### API Gateway
- REST API エンドポイント
- CORS設定済み
- レート制限: 1000 req/min

### S3バケット
- 静的ウェブサイトホスティング
- パブリック読み取り権限
- CORS設定済み

## トラブルシューティング

### よくあるエラー

#### 1. SAMビルドエラー
```bash
# 依存関係を再インストール
cd lambda
npm install
```

#### 2. S3バケット名の競合
```bash
# 一意のバケット名を指定
S3_BUCKET=your-unique-bucket-name npm run deploy:frontend
```

#### 3. 権限エラー
必要なIAM権限:
- CloudFormation: フルアクセス
- Lambda: フルアクセス
- DynamoDB: フルアクセス
- API Gateway: フルアクセス
- S3: フルアクセス
- IAM: ロール作成権限

### ログの確認
```bash
# Lambda関数のログ
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/iraira

# API Gatewayのログ
aws logs describe-log-groups --log-group-name-prefix API-Gateway-Execution-Logs
```

### スタックの削除
```bash
aws cloudformation delete-stack --stack-name iraira-wire-game-dev --region ap-northeast-1
```

## 本番環境への注意事項

### セキュリティ
- CORS設定を本番ドメインに限定
- API Gatewayのレート制限を調整
- CloudWatchアラームの設定確認

### パフォーマンス
- Lambda関数のメモリサイズ調整
- DynamoDBの容量モード確認
- CloudFrontの設定（本番環境では推奨）

### 監視
- CloudWatchダッシュボードの作成
- アラーム通知の設定
- X-Rayトレーシングの有効化

## 参考リンク
- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)