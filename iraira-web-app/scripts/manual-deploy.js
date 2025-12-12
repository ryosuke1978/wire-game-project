#!/usr/bin/env node

/**
 * SAM CLIなしでのマニュアルデプロイスクリプト
 * AWS CLIを使用してLambda関数とインフラをデプロイ
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { loadEnv } from './load-env.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイルから環境変数を読み込み
loadEnv();

// 環境変数
const environment = process.env.ENVIRONMENT || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';
const stackName = `iraira-wire-game-${environment}`;
const s3Bucket = process.env.S3_BUCKET || `iraira-lambda-deploy-${environment}`;

console.log('🚀 マニュアルデプロイを開始...');
console.log(`🌍 環境: ${environment}`);
console.log(`📍 リージョン: ${region}`);
console.log(`📦 スタック名: ${stackName}`);
console.log(`🪣 S3バケット: ${s3Bucket}`);

const lambdaDir = path.join(__dirname, '..', 'lambda');
const srcDir = path.join(lambdaDir, 'src');

try {
  // S3バケットの作成（存在しない場合）
  console.log('🪣 S3バケットを確認中...');
  try {
    execSync(`aws s3 ls s3://${s3Bucket}`, { stdio: 'pipe' });
    console.log('✅ S3バケットが存在します');
  } catch (error) {
    console.log('📦 S3バケットを作成中...');
    execSync(`aws s3 mb s3://${s3Bucket} --region ${region}`, { stdio: 'inherit' });
  }

  // Lambda関数のパッケージ化
  console.log('📦 Lambda関数をパッケージ化中...');
  
  const functions = ['submitScore', 'getLeaderboard', 'getPlayerHistory'];
  const functionZips = {};

  for (const funcName of functions) {
    const funcDir = path.join(srcDir, 'handlers');
    const zipFile = path.join(lambdaDir, `${funcName}.zip`);
    
    // 一時ディレクトリを作成
    const tempDir = path.join(lambdaDir, `temp-${funcName}`);
    if (fs.existsSync(tempDir)) {
      execSync(`rmdir /s /q "${tempDir}"`, { stdio: 'pipe' });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    // 必要なファイルをコピー
    execSync(`copy "${path.join(funcDir, funcName + '.js')}" "${tempDir}"`, { stdio: 'pipe' });
    execSync(`copy "${path.join(lambdaDir, 'package.json')}" "${tempDir}"`, { stdio: 'pipe' });
    
    // node_modulesをコピー（存在する場合）
    const nodeModulesPath = path.join(lambdaDir, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      execSync(`xcopy "${nodeModulesPath}" "${path.join(tempDir, 'node_modules')}" /E /I /Q`, { stdio: 'pipe' });
    }
    
    // ZIPファイルを作成
    process.chdir(tempDir);
    execSync(`powershell Compress-Archive -Path * -DestinationPath "${zipFile}" -Force`, { stdio: 'pipe' });
    process.chdir(lambdaDir);
    
    // S3にアップロード
    const s3Key = `lambda-functions/${funcName}.zip`;
    execSync(`aws s3 cp "${zipFile}" s3://${s3Bucket}/${s3Key}`, { stdio: 'inherit' });
    
    functionZips[funcName] = `s3://${s3Bucket}/${s3Key}`;
    
    // 一時ディレクトリを削除
    execSync(`rmdir /s /q "${tempDir}"`, { stdio: 'pipe' });
    
    console.log(`✅ ${funcName} パッケージ完了`);
  }

  // CloudFormationテンプレートを作成
  console.log('📄 CloudFormationテンプレートを作成中...');
  const cfTemplate = createCloudFormationTemplate(functionZips, environment);
  const templateFile = path.join(lambdaDir, 'cloudformation-template.json');
  fs.writeFileSync(templateFile, JSON.stringify(cfTemplate, null, 2));

  // CloudFormationスタックをデプロイ
  console.log('🚀 CloudFormationスタックをデプロイ中...');
  const deployCommand = [
    'aws cloudformation deploy',
    '--template-file', templateFile,
    '--stack-name', stackName,
    '--region', region,
    '--capabilities CAPABILITY_IAM',
    '--parameter-overrides',
    `Environment=${environment}`,
    `S3Bucket=${s3Bucket}`
  ].join(' ');
  
  execSync(deployCommand, { stdio: 'inherit' });
  
  console.log('✅ デプロイ完了');
  
  // スタック出力を取得
  console.log('📋 スタック出力を取得中...');
  const describeCommand = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${region} --query "Stacks[0].Outputs" --output table`;
  execSync(describeCommand, { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ デプロイエラー:', error.message);
  process.exit(1);
}

function createCloudFormationTemplate(functionZips, environment) {
  return {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Iraira Wire Game Lambda Functions",
    "Parameters": {
      "Environment": {
        "Type": "String",
        "Default": environment
      },
      "S3Bucket": {
        "Type": "String",
        "Description": "S3 bucket containing Lambda function code"
      }
    },
    "Resources": {
      "ScoresTable": {
        "Type": "AWS::DynamoDB::Table",
        "Properties": {
          "TableName": { "Fn::Sub": "wire-game-scores-${Environment}" },
          "BillingMode": "ON_DEMAND",
          "AttributeDefinitions": [
            { "AttributeName": "difficulty", "AttributeType": "S" },
            { "AttributeName": "timestamp", "AttributeType": "N" },
            { "AttributeName": "playerName", "AttributeType": "S" }
          ],
          "KeySchema": [
            { "AttributeName": "difficulty", "KeyType": "HASH" },
            { "AttributeName": "timestamp", "KeyType": "RANGE" }
          ],
          "GlobalSecondaryIndexes": [
            {
              "IndexName": "PlayerIndex",
              "KeySchema": [
                { "AttributeName": "playerName", "KeyType": "HASH" },
                { "AttributeName": "timestamp", "KeyType": "RANGE" }
              ],
              "Projection": { "ProjectionType": "ALL" }
            }
          ],
          "PointInTimeRecoverySpecification": {
            "PointInTimeRecoveryEnabled": true
          },
          "SSESpecification": {
            "SSEEnabled": true
          }
        }
      },
      "LambdaExecutionRole": {
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
              {
                "Effect": "Allow",
                "Principal": { "Service": "lambda.amazonaws.com" },
                "Action": "sts:AssumeRole"
              }
            ]
          },
          "ManagedPolicyArns": [
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
          ],
          "Policies": [
            {
              "PolicyName": "DynamoDBAccess",
              "PolicyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                  {
                    "Effect": "Allow",
                    "Action": [
                      "dynamodb:PutItem",
                      "dynamodb:GetItem",
                      "dynamodb:Query",
                      "dynamodb:Scan"
                    ],
                    "Resource": [
                      { "Fn::GetAtt": ["ScoresTable", "Arn"] },
                      { "Fn::Sub": "${ScoresTable}/index/*" }
                    ]
                  }
                ]
              }
            }
          ]
        }
      },
      "SubmitScoreFunction": {
        "Type": "AWS::Lambda::Function",
        "Properties": {
          "FunctionName": { "Fn::Sub": "iraira-submit-score-${Environment}" },
          "Runtime": "nodejs18.x",
          "Handler": "submitScore.handler",
          "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
          "Code": {
            "S3Bucket": { "Ref": "S3Bucket" },
            "S3Key": "lambda-functions/submitScore.zip"
          },
          "Environment": {
            "Variables": {
              "TABLE_NAME": { "Ref": "ScoresTable" },
              "NODE_ENV": { "Ref": "Environment" }
            }
          },
          "Timeout": 30,
          "MemorySize": 256
        }
      },
      "GetLeaderboardFunction": {
        "Type": "AWS::Lambda::Function",
        "Properties": {
          "FunctionName": { "Fn::Sub": "iraira-get-leaderboard-${Environment}" },
          "Runtime": "nodejs18.x",
          "Handler": "getLeaderboard.handler",
          "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
          "Code": {
            "S3Bucket": { "Ref": "S3Bucket" },
            "S3Key": "lambda-functions/getLeaderboard.zip"
          },
          "Environment": {
            "Variables": {
              "TABLE_NAME": { "Ref": "ScoresTable" },
              "NODE_ENV": { "Ref": "Environment" }
            }
          },
          "Timeout": 30,
          "MemorySize": 256
        }
      },
      "GetPlayerHistoryFunction": {
        "Type": "AWS::Lambda::Function",
        "Properties": {
          "FunctionName": { "Fn::Sub": "iraira-get-player-history-${Environment}" },
          "Runtime": "nodejs18.x",
          "Handler": "getPlayerHistory.handler",
          "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
          "Code": {
            "S3Bucket": { "Ref": "S3Bucket" },
            "S3Key": "lambda-functions/getPlayerHistory.zip"
          },
          "Environment": {
            "Variables": {
              "TABLE_NAME": { "Ref": "ScoresTable" },
              "NODE_ENV": { "Ref": "Environment" }
            }
          },
          "Timeout": 30,
          "MemorySize": 256
        }
      },
      "ApiGateway": {
        "Type": "AWS::ApiGateway::RestApi",
        "Properties": {
          "Name": { "Fn::Sub": "iraira-wire-game-api-${Environment}" },
          "Description": "API for Iraira Wire Game"
        }
      },
      "ApiGatewayDeployment": {
        "Type": "AWS::ApiGateway::Deployment",
        "DependsOn": ["SubmitScoreMethod", "GetLeaderboardMethod", "GetPlayerHistoryMethod"],
        "Properties": {
          "RestApiId": { "Ref": "ApiGateway" },
          "StageName": { "Ref": "Environment" }
        }
      }
    },
    "Outputs": {
      "ApiGatewayEndpoint": {
        "Description": "API Gateway endpoint URL",
        "Value": { "Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}" }
      },
      "ScoresTableName": {
        "Description": "DynamoDB table name for scores",
        "Value": { "Ref": "ScoresTable" }
      }
    }
  };
}