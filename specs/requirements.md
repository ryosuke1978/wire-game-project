# Requirements Document

## Introduction

キーボードの矢印キーで操作するイライラ棒ゲームのWebアプリケーション。プレイヤーはキャラクターを壁に触れないように移動させながらゴールを目指します。AWSのサーバーレスアーキテクチャで動作し、スコアやプレイ記録を保存できるシステムです。

## Glossary

- **Game System**: キーボード操作イライラ棒ゲームのWebアプリケーション全体
- **Player**: ゲームをプレイするユーザー
- **Character**: プレイヤーが矢印キーで操作するゲーム内のキャラクター
- **Wall**: ゲームエリア内の障害物（触れるとゲームオーバー）
- **Path**: 壁と壁の間の通路
- **Goal**: ゲームのクリア地点
- **Game Area**: ゲームが行われる画面上の領域
- **Score**: プレイ時間やミス回数に基づいて計算される得点
- **Backend Service**: AWS Lambda上で動作するサーバーレスバックエンド
- **Database**: DynamoDB上のスコアとプレイ記録のデータストア

## Requirements

### Requirement 1（要件1）

**User Story（ユーザーストーリー）:** As a player, I want to control the character with arrow keys, so that I can navigate through the game path.
（プレイヤーとして、矢印キーでキャラクターを操作したい。そうすることで、ゲームの通路を進むことができる。）

#### Acceptance Criteria（受入基準）

1. WHEN the player presses an arrow key (up, down, left, right), THE Game System SHALL change the Character movement direction to the corresponding direction
   （プレイヤーが矢印キー（上、下、左、右）を押したとき、ゲームシステムはキャラクターの移動方向を対応する方向に変更しなければならない）
2. WHEN a movement direction is set, THE Game System SHALL continue moving the Character in that direction at a constant speed until a different arrow key is pressed
   （移動方向が設定されたとき、ゲームシステムは別の矢印キーが押されるまで、その方向に一定速度でキャラクターを移動し続けなければならない）
3. WHEN the Character position is updated, THE Game System SHALL render the Character at the new position within 16 milliseconds
   （キャラクターの位置が更新されたとき、ゲームシステムは16ミリ秒以内に新しい位置でキャラクターを描画しなければならない）
4. WHEN a different arrow key is pressed, THE Game System SHALL immediately change the movement direction without stopping the Character
   （別の矢印キーが押されたとき、ゲームシステムはキャラクターを停止させずに即座に移動方向を変更しなければならない）
5. WHEN the game is not started, THE Game System SHALL ignore arrow key inputs without triggering game mechanics
   （ゲームが開始されていないとき、ゲームシステムはゲームメカニクスを起動せずに矢印キー入力を無視しなければならない）

### Requirement 2（要件2）

**User Story（ユーザーストーリー）:** As a player, I want the game to detect when I touch the walls, so that I know when I've made a mistake.
（プレイヤーとして、壁に触れたことを検知してほしい。そうすることで、ミスをしたことがわかる。）

#### Acceptance Criteria（受入基準）

1. WHEN the Character touches any wall boundary, THE Game System SHALL immediately trigger a game over condition
   （キャラクターが壁の境界に触れたとき、ゲームシステムは即座にゲームオーバー状態を起動しなければならない）
2. WHEN a game over condition is triggered, THE Game System SHALL stop the game timer and display the final result
   （ゲームオーバー状態が起動されたとき、ゲームシステムはゲームタイマーを停止し、最終結果を表示しなければならない）
3. WHEN collision detection occurs, THE Game System SHALL check for collision at least 60 times per second
   （衝突検知が行われるとき、ゲームシステムは少なくとも毎秒60回衝突をチェックしなければならない）
4. WHEN the Character is within the safe path area, THE Game System SHALL allow continued gameplay without interruption
   （キャラクターが安全な通路エリア内にあるとき、ゲームシステムは中断なくゲームプレイを継続させなければならない）

### Requirement 3（要件3）

**User Story（ユーザーストーリー）:** As a player, I want to see my progress and time, so that I can track my performance.
（プレイヤーとして、進捗と時間を見たい。そうすることで、自分のパフォーマンスを追跡できる。）

#### Acceptance Criteria（受入基準）

1. WHEN the game starts, THE Game System SHALL initialize a timer at zero seconds
   （ゲームが開始されたとき、ゲームシステムはタイマーをゼロ秒で初期化しなければならない）
2. WHEN the game is in progress, THE Game System SHALL update the displayed timer every 100 milliseconds
   （ゲームが進行中のとき、ゲームシステムは100ミリ秒ごとに表示されるタイマーを更新しなければならない）
3. WHEN the player reaches the goal, THE Game System SHALL record the completion time as the final score
   （プレイヤーがゴールに到達したとき、ゲームシステムは完了時間を最終スコアとして記録しなければならない）
4. WHEN the game ends, THE Game System SHALL display the elapsed time to the player
   （ゲームが終了したとき、ゲームシステムは経過時間をプレイヤーに表示しなければならない）

### Requirement 4（要件4）

**User Story（ユーザーストーリー）:** As a player, I want to start and restart the game easily, so that I can play multiple times.
（プレイヤーとして、ゲームを簡単に開始・再開始したい。そうすることで、何度もプレイできる。）

#### Acceptance Criteria（受入基準）

1. WHEN the player clicks a start button, THE Game System SHALL initialize a new game session with timer at zero
   （プレイヤーがスタートボタンをクリックしたとき、ゲームシステムはタイマーをゼロにして新しいゲームセッションを初期化しなければならない）
2. WHEN the game ends (either by completion or game over), THE Game System SHALL display a restart button
   （ゲームが終了したとき（完了またはゲームオーバーのいずれか）、ゲームシステムは再スタートボタンを表示しなければならない）
3. WHEN the player clicks the restart button, THE Game System SHALL reset all game state and allow a new attempt
   （プレイヤーが再スタートボタンをクリックしたとき、ゲームシステムはすべてのゲーム状態をリセットし、新しい試行を許可しなければならない）
4. WHEN a new game starts, THE Game System SHALL clear previous game results from the display
   （新しいゲームが開始されたとき、ゲームシステムは表示から以前のゲーム結果をクリアしなければならない）

### Requirement 5（要件5）

**User Story（ユーザーストーリー）:** As a player, I want to see different difficulty levels, so that I can challenge myself progressively.
（プレイヤーとして、異なる難易度レベルを見たい。そうすることで、段階的に自分に挑戦できる。）

#### Acceptance Criteria（受入基準）

1. WHEN the player selects a difficulty level, THE Game System SHALL generate a path with width and character speed appropriate to that difficulty
   （プレイヤーが難易度レベルを選択したとき、ゲームシステムはその難易度に適した幅とキャラクター速度の通路を生成しなければならない）
2. WHEN easy difficulty is selected, THE Game System SHALL create paths with minimum width of 100 pixels and set character speed to 2 pixels per frame
   （イージー難易度が選択されたとき、ゲームシステムは最小幅100ピクセルの通路を作成し、キャラクター速度を1フレームあたり2ピクセルに設定しなければならない）
3. WHEN medium difficulty is selected, THE Game System SHALL create paths with minimum width of 60 pixels and set character speed to 3 pixels per frame
   （ミディアム難易度が選択されたとき、ゲームシステムは最小幅60ピクセルの通路を作成し、キャラクター速度を1フレームあたり3ピクセルに設定しなければならない）
4. WHEN hard difficulty is selected, THE Game System SHALL create paths with minimum width of 40 pixels and set character speed to 4 pixels per frame
   （ハード難易度が選択されたとき、ゲームシステムは最小幅40ピクセルの通路を作成し、キャラクター速度を1フレームあたり4ピクセルに設定しなければならない）
5. WHEN super hard difficulty is selected, THE Game System SHALL create paths with minimum width of 30 pixels and set character speed to 6 pixels per frame
   （スーパーハード難易度が選択されたとき、ゲームシステムは最小幅30ピクセルの通路を作成し、キャラクター速度を1フレームあたり6ピクセルに設定しなければならない）
6. WHERE multiple difficulty levels exist, THE Game System SHALL allow the player to select difficulty before starting
   （複数の難易度レベルが存在する場合、ゲームシステムは開始前にプレイヤーが難易度を選択できるようにしなければならない）

### Requirement 6（要件6）

**User Story（ユーザーストーリー）:** As a player, I want my scores to be saved, so that I can track my best performances over time.
（プレイヤーとして、スコアを保存してほしい。そうすることで、時間をかけて自分のベストパフォーマンスを追跡できる。）

#### Acceptance Criteria（受入基準）

1. WHEN the player completes a game, THE Game System SHALL send the score data to the Backend Service
   （プレイヤーがゲームを完了したとき、ゲームシステムはスコアデータをバックエンドサービスに送信しなければならない）
2. WHEN the Backend Service receives score data, THE Backend Service SHALL store the score with timestamp in the Database
   （バックエンドサービスがスコアデータを受信したとき、バックエンドサービスはタイムスタンプ付きでスコアをデータベースに保存しなければならない）
3. WHEN storing scores, THE Backend Service SHALL associate each score with the difficulty level played
   （スコアを保存するとき、バックエンドサービスは各スコアをプレイした難易度レベルと関連付けなければならない）
4. WHEN the player requests their score history, THE Backend Service SHALL retrieve and return scores from the Database sorted by date
   （プレイヤーがスコア履歴を要求したとき、バックエンドサービスはデータベースから日付順にソートされたスコアを取得して返さなければならない）

### Requirement 7（要件7）

**User Story（ユーザーストーリー）:** As a player, I want to see a leaderboard, so that I can compare my performance with others.
（プレイヤーとして、リーダーボードを見たい。そうすることで、自分のパフォーマンスを他の人と比較できる。）

#### Acceptance Criteria（受入基準）

1. WHEN the player requests the leaderboard, THE Backend Service SHALL retrieve the top 10 scores for each difficulty level from the Database
   （プレイヤーがリーダーボードを要求したとき、バックエンドサービスは各難易度レベルのトップ10スコアをデータベースから取得しなければならない）
2. WHEN displaying the leaderboard, THE Game System SHALL show player name, score, and date for each entry
   （リーダーボードを表示するとき、ゲームシステムは各エントリーのプレイヤー名、スコア、日付を表示しなければならない）
3. WHEN multiple scores exist for the same player, THE Backend Service SHALL include all scores in chronological order
   （同じプレイヤーの複数のスコアが存在するとき、バックエンドサービスはすべてのスコアを時系列順に含めなければならない）
4. WHEN the leaderboard is displayed, THE Game System SHALL organize scores by difficulty level
   （リーダーボードが表示されるとき、ゲームシステムはスコアを難易度レベル別に整理しなければならない）

### Requirement 8（要件8）

**User Story（ユーザーストーリー）:** As a player, I want to enter my name, so that my scores are attributed to me on the leaderboard.
（プレイヤーとして、名前を入力したい。そうすることで、リーダーボード上で自分のスコアが自分に帰属される。）

#### Acceptance Criteria（受入基準）

1. WHEN the player completes a game, THE Game System SHALL prompt the player to enter their name
   （プレイヤーがゲームを完了したとき、ゲームシステムはプレイヤーに名前の入力を促さなければならない）
2. WHEN the player submits their name, THE Game System SHALL validate that the name is between 1 and 20 characters
   （プレイヤーが名前を送信したとき、ゲームシステムは名前が1文字以上20文字以下であることを検証しなければならない）
3. WHEN the player submits their name, THE Game System SHALL sanitize the input to prevent injection attacks by allowing only alphanumeric characters, spaces, hyphens, and underscores
   （プレイヤーが名前を送信したとき、ゲームシステムは英数字、スペース、ハイフン、アンダースコアのみを許可することでインジェクション攻撃を防ぐために入力をサニタイズしなければならない）
4. WHEN the Backend Service receives a name, THE Backend Service SHALL validate and sanitize the name again before storing in the Database
   （バックエンドサービスが名前を受信したとき、バックエンドサービスはデータベースに保存する前に名前を再度検証およびサニタイズしなければならない）
5. WHEN the name validation fails, THE Game System SHALL display an error message and allow re-entry
   （名前の検証が失敗したとき、ゲームシステムはエラーメッセージを表示し、再入力を許可しなければならない）
6. WHEN a valid name is provided, THE Game System SHALL include the name with the score submission to the Backend Service
   （有効な名前が提供されたとき、ゲームシステムはバックエンドサービスへのスコア送信に名前を含めなければならない）

### Requirement 9（要件9）

**User Story（ユーザーストーリー）:** As a system administrator, I want the application to run on AWS serverless infrastructure, so that it scales automatically and minimizes operational costs.
（システム管理者として、アプリケーションをAWSサーバーレスインフラストラクチャ上で実行したい。そうすることで、自動的にスケールし、運用コストを最小化できる。）

#### Acceptance Criteria（受入基準）

1. WHEN the Backend Service receives API requests, THE Backend Service SHALL execute on AWS Lambda functions
   （バックエンドサービスがAPIリクエストを受信したとき、バックエンドサービスはAWS Lambda関数上で実行されなければならない）
2. WHEN score data needs to be stored or retrieved, THE Backend Service SHALL use DynamoDB as the data store
   （スコアデータを保存または取得する必要があるとき、バックエンドサービスはデータストアとしてDynamoDBを使用しなければならない）
3. WHEN the web application is accessed, THE Game System SHALL be served from Amazon S3 with CloudFront distribution
   （Webアプリケーションにアクセスされたとき、ゲームシステムはCloudFrontディストリビューションを使用してAmazon S3から提供されなければならない）
4. WHEN API requests are made from the frontend, THE Game System SHALL communicate through Amazon API Gateway
   （フロントエンドからAPIリクエストが行われたとき、ゲームシステムはAmazon API Gatewayを通じて通信しなければならない）

### Requirement 10（要件10）

**User Story（ユーザーストーリー）:** As a player, I want the game to have smooth animations and responsive controls, so that the gameplay feels natural and enjoyable.
（プレイヤーとして、ゲームにスムーズなアニメーションと応答性の高いコントロールを持たせたい。そうすることで、ゲームプレイが自然で楽しいものになる。）

#### Acceptance Criteria（受入基準）

1. WHEN the game is rendering, THE Game System SHALL maintain a frame rate of at least 60 frames per second
   （ゲームがレンダリングされているとき、ゲームシステムは少なくとも毎秒60フレームのフレームレートを維持しなければならない）
2. WHEN the Character moves, THE Game System SHALL update the display without visible lag or stuttering
   （キャラクターが移動するとき、ゲームシステムは目に見えるラグやカクつきなしで表示を更新しなければならない）
3. WHEN collision detection occurs, THE Game System SHALL provide immediate visual feedback within one frame
   （衝突検知が発生したとき、ゲームシステムは1フレーム以内に即座に視覚的フィードバックを提供しなければならない）
4. WHEN the game state changes, THE Game System SHALL animate transitions smoothly over 200-300 milliseconds
   （ゲーム状態が変化したとき、ゲームシステムは200〜300ミリ秒かけてスムーズに遷移をアニメーション化しなければならない）
5. WHEN arrow keys are pressed, THE Game System SHALL respond to input within 16 milliseconds
   （矢印キーが押されたとき、ゲームシステムは16ミリ秒以内に入力に応答しなければならない）

### Requirement 11（要件11）

**User Story（ユーザーストーリー）:** As a player, I want to see celebratory animations when I succeed or fail, so that the game feels more engaging and fun.
（プレイヤーとして、成功または失敗したときに祝福的なアニメーションを見たい。そうすることで、ゲームがより魅力的で楽しいものになる。）

#### Acceptance Criteria（受入基準）

1. WHEN the Character collides with a wall, THE Game System SHALL display an explosion or crash animation at the collision point
   （キャラクターが壁に衝突したとき、ゲームシステムは衝突地点に爆発またはクラッシュアニメーションを表示しなければならない）
2. WHEN a game over occurs, THE Game System SHALL play a dramatic animation sequence lasting 1-2 seconds before showing the results
   （ゲームオーバーが発生したとき、ゲームシステムは結果を表示する前に1〜2秒間のドラマチックなアニメーションシーケンスを再生しなければならない）
3. WHEN the Character reaches the goal, THE Game System SHALL display a celebration animation with confetti or fireworks effects
   （キャラクターがゴールに到達したとき、ゲームシステムは紙吹雪または花火エフェクトを伴う祝福アニメーションを表示しなければならない）
4. WHEN a goal is reached, THE Game System SHALL play a victory animation sequence lasting 2-3 seconds before showing the score submission screen
   （ゴールに到達したとき、ゲームシステムはスコア送信画面を表示する前に2〜3秒間の勝利アニメーションシーケンスを再生しなければならない）
5. WHEN animations are playing, THE Game System SHALL prevent player input until the animation completes
   （アニメーションが再生されているとき、ゲームシステムはアニメーションが完了するまでプレイヤー入力を防止しなければならない）
