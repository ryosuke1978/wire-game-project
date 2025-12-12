# Windows用セットアップスクリプト
# PowerShellで実行: .\scripts\setup-windows.ps1

Write-Host "🚀 Windows環境セットアップを開始..." -ForegroundColor Green

# .envファイルの確認
if (-not (Test-Path ".env")) {
    Write-Host "📁 .envファイルを作成中..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .envファイルを作成しました" -ForegroundColor Green
    Write-Host "⚠️  .envファイルを編集してAWS認証情報を設定してください" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "必要な設定項目:" -ForegroundColor Cyan
    Write-Host "  AWS_ACCESS_KEY_ID=your-access-key-id" -ForegroundColor Gray
    Write-Host "  AWS_SECRET_ACCESS_KEY=your-secret-access-key" -ForegroundColor Gray
    Write-Host "  AWS_DEFAULT_REGION=ap-northeast-1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ .envファイルが存在します" -ForegroundColor Green
}

# Node.jsの確認
Write-Host "🔍 Node.jsバージョンを確認中..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.jsがインストールされていません" -ForegroundColor Red
    Write-Host "💡 https://nodejs.org/ からNode.js 18.x以上をインストールしてください" -ForegroundColor Yellow
    exit 1
}

# AWS CLIの確認
Write-Host "🔍 AWS CLIを確認中..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLIがインストールされていません" -ForegroundColor Red
    Write-Host "💡 https://aws.amazon.com/cli/ からAWS CLI v2をインストールしてください" -ForegroundColor Yellow
    exit 1
}

# SAM CLIの確認
Write-Host "🔍 SAM CLIを確認中..." -ForegroundColor Yellow
try {
    $samVersion = sam --version
    Write-Host "✅ SAM CLI: $samVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ SAM CLIがインストールされていません" -ForegroundColor Red
    Write-Host "💡 https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html からSAM CLIをインストールしてください" -ForegroundColor Yellow
    exit 1
}

# 依存関係のインストール
Write-Host "📦 依存関係をインストール中..." -ForegroundColor Yellow
npm install

Write-Host "📦 Lambda依存関係をインストール中..." -ForegroundColor Yellow
Set-Location "lambda"
npm install
Set-Location ".."

# 環境変数の読み込みテスト
Write-Host "🔧 環境変数を確認中..." -ForegroundColor Yellow
node scripts/load-env.js

Write-Host ""
Write-Host "🎉 セットアップ完了!" -ForegroundColor Green
Write-Host ""
Write-Host "次のステップ:" -ForegroundColor Cyan
Write-Host "1. .envファイルを編集してAWS認証情報を設定" -ForegroundColor Gray
Write-Host "2. デプロイを実行: npm run deploy:all" -ForegroundColor Gray
Write-Host ""