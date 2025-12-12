# SAM CLI インストールガイド

AWS SAM CLIは、サーバーレスアプリケーションの開発とデプロイに必要なツールです。

## Windows用インストール手順

### 方法1: MSIインストーラー（推奨）

1. [AWS SAM CLI公式ページ](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-windows.html)にアクセス

2. 最新のMSIインストーラーをダウンロード:
   - [AWS SAM CLI MSI (64-bit)](https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi)

3. ダウンロードしたMSIファイルを実行してインストール

4. インストール完認認:
   ```bash
   sam --version
   ```

### 方法2: Chocolatey

```powershell
# Chocolateyがインストールされている場合
choco install aws-sam-cli
```

### 方法3: pip

```bash
# Python 3.8以上が必要
pip install aws-sam-cli
```

## インストール後の確認

```bash
# SAM CLIバージョン確認
sam --version

# SAM CLIヘルプ
sam --help
```

## 必要な前提条件

### Docker Desktop
SAM CLIはローカル開発でDockerを使用します：

1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)をダウンロード
2. インストール後、Docker Desktopを起動
3. 確認: `docker --version`

### Python 3.8以上
```bash
python --version
# または
python3 --version
```

## トラブルシューティング

### PATH環境変数の問題
SAM CLIがインストールされているのに認識されない場合：

1. コマンドプロンプトを再起動
2. システム環境変数のPATHを確認
3. SAM CLIのインストールパスを手動でPATHに追加

### Docker関連エラー
```bash
# Docker Desktopが起動しているか確認
docker ps
```

### 権限エラー
管理者権限でコマンドプロンプトを開いて実行

## インストール完了後

SAM CLIがインストールできたら、以下のコマンドでデプロイを開始できます：

```bash
# セットアップ確認
node scripts/setup-windows.js

# AWS認証テスト
node scripts/test-aws-auth.js

# バックエンドデプロイ
npm run deploy:backend
```