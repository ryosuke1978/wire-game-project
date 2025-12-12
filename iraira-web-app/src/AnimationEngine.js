/**
 * AnimationEngine - ゲームオーバーと勝利時のアニメーションを管理
 * 
 * 要件:
 * - 11.1: 衝突時に爆発アニメーションを表示
 * - 11.2: ゲームオーバー時に1-2秒のドラマチックなアニメーション
 * - 11.3: ゴール到達時に紙吹雪/花火エフェクト
 * - 11.4: 勝利時に2-3秒のアニメーション
 * - 11.5: アニメーション中は入力を防止
 */
class AnimationEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.isAnimating = false;
    this.animationType = null; // 'explosion' or 'victory'
    this.animationStartTime = 0;
    this.animationDuration = 0;
    this.animationCallback = null;
  }

  /**
   * 爆発アニメーションを再生
   * @param {number} x - 爆発の中心X座標
   * @param {number} y - 爆発の中心Y座標
   * @param {Function} callback - アニメーション完了時のコールバック
   */
  playExplosion(x, y, callback) {
    this.isAnimating = true;
    this.animationType = 'explosion';
    this.animationStartTime = Date.now();
    this.animationDuration = 1500; // 1.5秒（要件11.2: 1-2秒）
    this.animationCallback = callback;
    this.particles = [];

    // 爆発パーティクルを生成
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        size: 3 + Math.random() * 5,
        color: this._getExplosionColor()
      });
    }
  }

  /**
   * 勝利アニメーションを再生
   * @param {number} x - 勝利エフェクトの中心X座標
   * @param {number} y - 勝利エフェクトの中心Y座標
   * @param {Function} callback - アニメーション完了時のコールバック
   */
  playVictory(x, y, callback) {
    this.isAnimating = true;
    this.animationType = 'victory';
    this.animationStartTime = Date.now();
    this.animationDuration = 2500; // 2.5秒（要件11.4: 2-3秒）
    this.animationCallback = callback;
    this.particles = [];

    // 紙吹雪パーティクルを生成
    const confettiCount = 50;
    for (let i = 0; i < confettiCount; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 100,
        y: y - Math.random() * 50,
        vx: (Math.random() - 0.5) * 6,
        vy: -2 - Math.random() * 4,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.008,
        size: 4 + Math.random() * 6,
        color: this._getConfettiColor(),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    // 花火エフェクトも追加
    const fireworkCount = 20;
    for (let i = 0; i < fireworkCount; i++) {
      const angle = (Math.PI * 2 * i) / fireworkCount;
      const speed = 3 + Math.random() * 3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01,
        size: 2 + Math.random() * 4,
        color: this._getFireworkColor(),
        sparkle: true
      });
    }
  }

  /**
   * アニメーションフレームを更新
   * @param {number} deltaTime - 前フレームからの経過時間（ミリ秒）
   */
  update(deltaTime) {
    if (!this.isAnimating) return;

    const currentTime = Date.now();
    const elapsed = currentTime - this.animationStartTime;

    // アニメーション時間が経過した場合
    if (elapsed >= this.animationDuration) {
      this._endAnimation();
      return;
    }

    // パーティクルを更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // 位置を更新
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // 重力効果（勝利アニメーションの紙吹雪用）
      if (this.animationType === 'victory') {
        particle.vy += 0.1; // 重力
        if (particle.rotation !== undefined) {
          particle.rotation += particle.rotationSpeed;
        }
      }
      
      // ライフを減少
      particle.life -= particle.decay;
      
      // 死んだパーティクルを削除
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // パーティクルを描画
    this._drawParticles();
  }

  /**
   * アニメーションが再生中かどうかを返す
   * @returns {boolean} アニメーション再生中の場合true
   */
  isPlaying() {
    return this.isAnimating;
  }

  /**
   * パーティクルを描画
   * @private
   */
  _drawParticles() {
    this.ctx.save();
    
    for (const particle of this.particles) {
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      
      if (particle.rotation !== undefined) {
        // 回転する紙吹雪
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        this.ctx.restore();
      } else if (particle.sparkle) {
        // きらめく花火
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // スパークル効果
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x - particle.size, particle.y);
        this.ctx.lineTo(particle.x + particle.size, particle.y);
        this.ctx.moveTo(particle.x, particle.y - particle.size);
        this.ctx.lineTo(particle.x, particle.y + particle.size);
        this.ctx.stroke();
      } else {
        // 通常の円形パーティクル
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    this.ctx.restore();
  }

  /**
   * 爆発エフェクトの色を取得
   * @private
   * @returns {string} CSS色文字列
   */
  _getExplosionColor() {
    const colors = [
      '#ff4444', // 赤
      '#ff8844', // オレンジ
      '#ffff44', // 黄色
      '#ffffff', // 白
      '#ffaa44'  // 明るいオレンジ
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 紙吹雪の色を取得
   * @private
   * @returns {string} CSS色文字列
   */
  _getConfettiColor() {
    const colors = [
      '#ff6b6b', // 赤
      '#4ecdc4', // 青緑
      '#45b7d1', // 青
      '#96ceb4', // 緑
      '#ffeaa7', // 黄色
      '#dda0dd', // 紫
      '#98d8c8'  // ミント
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 花火の色を取得
   * @private
   * @returns {string} CSS色文字列
   */
  _getFireworkColor() {
    const colors = [
      '#ffd700', // 金
      '#ff69b4', // ピンク
      '#00ff7f', // 緑
      '#1e90ff', // 青
      '#ff6347', // 赤
      '#da70d6'  // 紫
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * アニメーションを終了
   * @private
   */
  _endAnimation() {
    this.isAnimating = false;
    this.animationType = null;
    this.particles = [];
    
    if (this.animationCallback) {
      const callback = this.animationCallback;
      this.animationCallback = null;
      callback();
    }
  }
}

export default AnimationEngine;