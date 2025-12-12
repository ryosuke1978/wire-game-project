/**
 * AnimationEngine テスト
 * 
 * プロパティベーステスト:
 * - Property 21: Collision Triggers Animation（衝突によるアニメーション起動）
 * - Property 23: Goal Triggers Victory Animation（ゴールによる勝利アニメーション）
 * - Property 25: Input Blocked During Animation（アニメーション中の入力ブロック）
 */

import AnimationEngine from '../src/AnimationEngine.js';
import fc from 'fast-check';

// Canvas モックを作成
const createMockCanvas = () => {
  const canvas = {
    width: 800,
    height: 600,
    getContext: jest.fn(() => ({
      save: jest.fn(),
      restore: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      set fillStyle(value) { this._fillStyle = value; },
      get fillStyle() { return this._fillStyle; },
      set strokeStyle(value) { this._strokeStyle = value; },
      get strokeStyle() { return this._strokeStyle; },
      set globalAlpha(value) { this._globalAlpha = value; },
      get globalAlpha() { return this._globalAlpha; },
      set lineWidth(value) { this._lineWidth = value; },
      get lineWidth() { return this._lineWidth; }
    }))
  };
  return canvas;
};

describe('AnimationEngine', () => {
  let animationEngine;
  let mockCanvas;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    animationEngine = new AnimationEngine(mockCanvas);
  });

  describe('基本機能テスト', () => {
    test('初期状態では再生中ではない', () => {
      expect(animationEngine.isPlaying()).toBe(false);
    });

    test('爆発アニメーション開始後は再生中になる', () => {
      const callback = jest.fn();
      animationEngine.playExplosion(100, 100, callback);
      expect(animationEngine.isPlaying()).toBe(true);
    });

    test('勝利アニメーション開始後は再生中になる', () => {
      const callback = jest.fn();
      animationEngine.playVictory(100, 100, callback);
      expect(animationEngine.isPlaying()).toBe(true);
    });
  });

  describe('プロパティベーステスト', () => {
    /**
     * Feature: mouse-wire-game, Property 21: Collision Triggers Animation
     * **Validates: Requirements 11.1**
     */
    test('Property 21: 衝突によるアニメーション起動', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 800 }), // x座標
          fc.integer({ min: 0, max: 600 }), // y座標
          (x, y) => {
            const engine = new AnimationEngine(createMockCanvas());
            const callback = jest.fn();
            
            // 衝突時にplayExplosionが呼ばれた場合
            engine.playExplosion(x, y, callback);
            
            // アニメーションが開始されることを確認
            expect(engine.isPlaying()).toBe(true);
            expect(engine.animationType).toBe('explosion');
            expect(engine.particles.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: mouse-wire-game, Property 23: Goal Triggers Victory Animation
     * **Validates: Requirements 11.3**
     */
    test('Property 23: ゴールによる勝利アニメーション', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 800 }), // x座標
          fc.integer({ min: 0, max: 600 }), // y座標
          (x, y) => {
            const engine = new AnimationEngine(createMockCanvas());
            const callback = jest.fn();
            
            // ゴール到達時にplayVictoryが呼ばれた場合
            engine.playVictory(x, y, callback);
            
            // 勝利アニメーションが開始されることを確認
            expect(engine.isPlaying()).toBe(true);
            expect(engine.animationType).toBe('victory');
            expect(engine.particles.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: mouse-wire-game, Property 25: Input Blocked During Animation
     * **Validates: Requirements 11.5**
     */
    test('Property 25: アニメーション中の入力ブロック', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('explosion', 'victory'),
          fc.integer({ min: 0, max: 800 }),
          fc.integer({ min: 0, max: 600 }),
          (animationType, x, y) => {
            const engine = new AnimationEngine(createMockCanvas());
            const callback = jest.fn();
            
            // アニメーションを開始
            if (animationType === 'explosion') {
              engine.playExplosion(x, y, callback);
            } else {
              engine.playVictory(x, y, callback);
            }
            
            // アニメーション中はisPlaying()がtrueを返すことを確認
            // これにより、入力ハンドラーが入力をブロックできる
            expect(engine.isPlaying()).toBe(true);
            
            // アニメーションが進行中であることを確認
            expect(engine.animationType).toBe(animationType);
            expect(engine.isAnimating).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('アニメーション時間テスト', () => {
    test('爆発アニメーションは1-2秒の範囲内', () => {
      const callback = jest.fn();
      animationEngine.playExplosion(100, 100, callback);
      
      // 1.5秒に設定されていることを確認（要件11.2: 1-2秒）
      expect(animationEngine.animationDuration).toBeGreaterThanOrEqual(1000);
      expect(animationEngine.animationDuration).toBeLessThanOrEqual(2000);
    });

    test('勝利アニメーションは2-3秒の範囲内', () => {
      const callback = jest.fn();
      animationEngine.playVictory(100, 100, callback);
      
      // 2.5秒に設定されていることを確認（要件11.4: 2-3秒）
      expect(animationEngine.animationDuration).toBeGreaterThanOrEqual(2000);
      expect(animationEngine.animationDuration).toBeLessThanOrEqual(3000);
    });
  });

  describe('アニメーション完了テスト', () => {
    test('アニメーション完了時にコールバックが呼ばれる', (done) => {
      const callback = jest.fn(() => {
        expect(animationEngine.isPlaying()).toBe(false);
        done();
      });
      
      animationEngine.playExplosion(100, 100, callback);
      
      // アニメーション時間を短縮してテスト
      animationEngine.animationDuration = 10;
      
      setTimeout(() => {
        animationEngine.update(20);
      }, 15);
    });
  });

  describe('パーティクルシステムテスト', () => {
    test('爆発アニメーションでパーティクルが生成される', () => {
      const callback = jest.fn();
      animationEngine.playExplosion(100, 100, callback);
      
      expect(animationEngine.particles.length).toBeGreaterThan(0);
      
      // パーティクルの基本プロパティを確認
      const particle = animationEngine.particles[0];
      expect(particle).toHaveProperty('x');
      expect(particle).toHaveProperty('y');
      expect(particle).toHaveProperty('vx');
      expect(particle).toHaveProperty('vy');
      expect(particle).toHaveProperty('life');
      expect(particle).toHaveProperty('decay');
      expect(particle).toHaveProperty('size');
      expect(particle).toHaveProperty('color');
    });

    test('勝利アニメーションで紙吹雪と花火が生成される', () => {
      const callback = jest.fn();
      animationEngine.playVictory(100, 100, callback);
      
      expect(animationEngine.particles.length).toBeGreaterThan(0);
      
      // 紙吹雪パーティクル（回転あり）と花火パーティクル（スパークルあり）が混在
      const hasConfetti = animationEngine.particles.some(p => p.rotation !== undefined);
      const hasFireworks = animationEngine.particles.some(p => p.sparkle === true);
      
      expect(hasConfetti).toBe(true);
      expect(hasFireworks).toBe(true);
    });
  });
});