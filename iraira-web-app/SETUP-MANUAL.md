# 手動セットアップガイド

自動セットアップでエラーが発生する場合の手動セットアップ手順です。

## 1. .envファイルの作成

```bash
# .env.exampleをコピー
copy .env.example .env
```

または手動で`.env`ファイルを作成：

```
# AWS認証情報（実際の値に置き換えてください）
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=ap-northeast-1

# デプロイ設定
ENVIRONMENT=dev
S3_BUCKET=iraira-web-game-dev
```

## 2. 依存関係のインストール

```bash
# ルートディレクトリ
npm install

# Lambdaディレクトリ
cd lambda
npm install
cd ..
```

## 3. 必要なツールの確認

### Node.js
```bash
node --version
# v18.0.0以上が必要
```

### AWS CLI
```bash
aws --version
# aws-cli/2.x.x以上が必要
```

### SAM CLI
```bash
sam --version
# SAM CLI, version 1.x.x以上が必要
```

## 4. AWS認証情報の設定

### 方法1: AWS CLI設定
```bash
aws configure
```

### 方法2: 環境変数（PowerShell）
```powershell
$env:AWS_ACCESS_KEY_ID="your-access-key-id"
$env:AWS_SECRET_ACCESS_KEY="your-secret-access-key"
$env:AWS_DEFAULT_REGION="ap-northeast-1"
```

### 方法3: .envファイル（推奨）
上記で作成した`.env`ファイルに実際の値を入力

## 5. 設定確認

```bash
# 環境変数の確認
npm run env:load

# AWS認証の確認
aws sts get-caller-identity
```

## 6. デプロイ

```bash
# 統合デプロイ
npm run deploy:all

# または個別デプロイ
npm run deploy:backend
npm run deploy:frontend
```

## トラブルシューティング

### PowerShell実行ポリシーエラー
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### npm権限エラー
```bash
# 管理者権限でコマンドプロンプトを開いて実行
```

### AWS CLI認証エラー
- IAMユーザーの権限を確認
- アクセスキーが正しいか確認
- リージョンが正しいか確認

### SAM CLIエラー
- Docker Desktopがインストールされているか確認
- SAM CLIが最新版か確認