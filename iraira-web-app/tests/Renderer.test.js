/**
 * Test suite for Renderer class
 * Rendererクラスのテストスイート
 */

const Renderer = require('../src/Renderer');

// Mock Canvas and Context for testing
class MockCanvasContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 0;
    this.font = '';
    this.textAlign = '';
    this.textBaseline = '';
    this.shadowColor = '';
    this.shadowBlur = 0;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    this.imageSmoothingEnabled = false;
    this.imageSmoothingQuality = '';
    
    // Track method calls
    this.calls = {
      fillRect: [],
      strokeRect: [],
      beginPath: 0,
      closePath: 0,
      moveTo: [],
      lineTo: [],
      arc: [],
      fill: 0,
      stroke: 0,
      fillText: [],
      save: 0,
      restore: 0,
      translate: [],
      rotate: []
    };
  }

  fillRect(x, y, width, height) {
    this.calls.fillRect.push({ x, y, width, height });
  }

  strokeRect(x, y, width, height) {
    this.calls.strokeRect.push({ x, y, width, height });
  }

  beginPath() {
    this.calls.beginPath++;
  }

  closePath() {
    this.calls.closePath++;
  }

  moveTo(x, y) {
    this.calls.moveTo.push({ x, y });
  }

  lineTo(x, y) {
    this.calls.lineTo.push({ x, y });
  }

  arc(x, y, radius, startAngle, endAngle) {
    this.calls.arc.push({ x, y, radius, startAngle, endAngle });
  }

  fill() {
    this.calls.fill++;
  }

  stroke() {
    this.calls.stroke++;
  }

  fillText(text, x, y) {
    this.calls.fillText.push({ text, x, y });
  }

  save() {
    this.calls.save++;
  }

  restore() {
    this.calls.restore++;
  }

  translate(x, y) {
    this.calls.translate.push({ x, y });
  }

  rotate(angle) {
    this.calls.rotate.push({ angle });
  }
}

class MockCanvas {
  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.context = new MockCanvasContext();
  }

  getContext(type) {
    if (type === '2d') {
      return this.context;
    }
    return null;
  }
}

describe('Renderer', () => {
  let canvas;
  let renderer;

  beforeEach(() => {
    canvas = new MockCanvas();
    renderer = new Renderer(canvas);
  });

  describe('Constructor', () => {
    test('should initialize with canvas element', () => {
      expect(renderer.canvas).toBe(canvas);
      expect(renderer.ctx).toBe(canvas.context);
      expect(renderer.width).toBe(800);
      expect(renderer.height).toBe(600);
    });

    test('should throw error if no canvas provided', () => {
      expect(() => new Renderer(null)).toThrow('Canvas element is required');
    });

    test('should throw error if canvas context is not available', () => {
      const badCanvas = { getContext: () => null };
      expect(() => new Renderer(badCanvas)).toThrow('Unable to get 2D context from canvas');
    });

    test('should set up canvas properties for smooth rendering', () => {
      expect(canvas.context.imageSmoothingEnabled).toBe(true);
      expect(canvas.context.imageSmoothingQuality).toBe('high');
    });
  });

  describe('clear()', () => {
    test('should clear the entire canvas with background color', () => {
      renderer.clear();
      
      expect(canvas.context.fillStyle).toBe('#1a1a2e');
      expect(canvas.context.calls.fillRect).toContainEqual({
        x: 0, y: 0, width: 800, height: 600
      });
    });
  });

  describe('drawWalls()', () => {
    test('should draw walls with correct style and dimensions', () => {
      const walls = [
        { x: 10, y: 20, width: 30, height: 40 },
        { x: 50, y: 60, width: 70, height: 80 }
      ];

      renderer.drawWalls(walls);

      expect(canvas.context.fillStyle).toBe('#e94560');
      expect(canvas.context.strokeStyle).toBe('#c0392b');
      expect(canvas.context.lineWidth).toBe(2);
      expect(canvas.context.calls.fillRect).toContainEqual({
        x: 10, y: 20, width: 30, height: 40
      });
      expect(canvas.context.calls.fillRect).toContainEqual({
        x: 50, y: 60, width: 70, height: 80
      });
    });

    test('should handle empty walls array', () => {
      renderer.drawWalls([]);
      expect(canvas.context.calls.fillRect).toHaveLength(0);
    });

    test('should handle null walls parameter', () => {
      renderer.drawWalls(null);
      expect(canvas.context.calls.fillRect).toHaveLength(0);
    });

    test('should skip invalid wall objects', () => {
      const walls = [
        { x: 10, y: 20, width: 30, height: 40 }, // valid
        { x: 'invalid', y: 20, width: 30, height: 40 }, // invalid
        null, // invalid
        { x: 50, y: 60, width: 70, height: 80 } // valid
      ];

      renderer.drawWalls(walls);

      expect(canvas.context.calls.fillRect).toHaveLength(2);
    });
  });

  describe('drawPath()', () => {
    test('should draw path with circles and connecting rectangles', () => {
      const path = [
        { x: 100, y: 100 },
        { x: 200, y: 150 },
        { x: 300, y: 200 }
      ];

      renderer.drawPath(path, 60);

      expect(canvas.context.fillStyle).toBe('#16213e');
      expect(canvas.context.calls.arc.length).toBeGreaterThan(0);
      expect(canvas.context.calls.fill).toBeGreaterThan(0);
    });

    test('should handle empty path array', () => {
      renderer.drawPath([]);
      expect(canvas.context.calls.arc).toHaveLength(0);
    });

    test('should handle null path parameter', () => {
      renderer.drawPath(null);
      expect(canvas.context.calls.arc).toHaveLength(0);
    });

    test('should use default path width when not specified', () => {
      const path = [{ x: 100, y: 100 }];
      renderer.drawPath(path);
      
      // Should draw with default width (radius = 30)
      expect(canvas.context.calls.arc[0].radius).toBe(30);
    });
  });

  describe('drawCharacter()', () => {
    test('should draw character as circle with glow effect', () => {
      const character = {
        x: 100,
        y: 150,
        size: 20,
        direction: 'right'
      };

      renderer.drawCharacter(character);

      // Check that character circle was drawn at correct position
      expect(canvas.context.calls.arc).toContainEqual({
        x: 110, y: 160, radius: 10, startAngle: 0, endAngle: Math.PI * 2
      });
      // Check that save/restore was called for proper context management
      expect(canvas.context.calls.save).toBeGreaterThan(0);
      expect(canvas.context.calls.restore).toBeGreaterThan(0);
      // Check that fill was called to draw the character
      expect(canvas.context.calls.fill).toBeGreaterThan(0);
    });

    test('should handle character without direction', () => {
      const character = {
        x: 100,
        y: 150,
        size: 20
      };

      renderer.drawCharacter(character);

      expect(canvas.context.calls.arc).toContainEqual({
        x: 110, y: 160, radius: 10, startAngle: 0, endAngle: Math.PI * 2
      });
    });

    test('should handle null character parameter', () => {
      renderer.drawCharacter(null);
      expect(canvas.context.calls.arc).toHaveLength(0);
    });

    test('should handle character with invalid coordinates', () => {
      const character = { x: 'invalid', y: 150, size: 20 };
      renderer.drawCharacter(character);
      expect(canvas.context.calls.arc).toHaveLength(0);
    });
  });

  describe('drawGoal()', () => {
    test('should draw goal as star with glow effect', () => {
      const goal = { x: 300, y: 400 };

      renderer.drawGoal(goal, 25);

      expect(canvas.context.fillStyle).toBe('#f39c12');
      expect(canvas.context.shadowColor).toBe('#f39c12');
      expect(canvas.context.calls.beginPath).toBeGreaterThan(0);
      expect(canvas.context.calls.fill).toBeGreaterThan(0);
    });

    test('should use default size when not specified', () => {
      const goal = { x: 300, y: 400 };
      renderer.drawGoal(goal);
      
      // Should draw with default size (30)
      expect(canvas.context.calls.moveTo.length).toBeGreaterThan(0);
    });

    test('should handle null goal parameter', () => {
      renderer.drawGoal(null);
      expect(canvas.context.calls.beginPath).toBe(0);
    });
  });

  describe('drawTimer()', () => {
    test('should draw timer with background and text', () => {
      renderer.drawTimer(12345); // 12.345 seconds

      expect(canvas.context.calls.fillRect).toContainEqual({
        x: 10, y: 5, width: 150, height: 35
      });
      expect(canvas.context.calls.fillText).toContainEqual({
        text: 'Time: 12.35s', x: 20, y: 30
      });
    });

    test('should handle zero time', () => {
      renderer.drawTimer(0);

      expect(canvas.context.calls.fillText).toContainEqual({
        text: 'Time: 0.00s', x: 20, y: 30
      });
    });

    test('should handle custom position', () => {
      renderer.drawTimer(5000, 100, 200);

      expect(canvas.context.calls.fillRect).toContainEqual({
        x: 90, y: 175, width: 150, height: 35
      });
      expect(canvas.context.calls.fillText).toContainEqual({
        text: 'Time: 5.00s', x: 100, y: 200
      });
    });

    test('should handle invalid time parameter', () => {
      renderer.drawTimer('invalid');
      expect(canvas.context.calls.fillText).toHaveLength(0);
    });
  });

  describe('drawUI()', () => {
    test('should draw gameplay UI for playing state', () => {
      const state = {
        status: 'playing',
        difficulty: 'medium'
      };

      renderer.drawUI(state);

      // Should draw difficulty indicator
      expect(canvas.context.calls.fillText.some(call => 
        call.text.includes('Difficulty: medium')
      )).toBe(true);
    });

    test('should draw paused UI for paused state', () => {
      const state = { status: 'paused' };

      renderer.drawUI(state);

      expect(canvas.context.calls.fillText.some(call => 
        call.text === 'PAUSED'
      )).toBe(true);
    });

    test('should handle null state parameter', () => {
      renderer.drawUI(null);
      // Should not throw error
      expect(canvas.context.calls.fillText).toHaveLength(0);
    });

    test('should handle unknown state status', () => {
      const state = { status: 'unknown' };
      renderer.drawUI(state);
      // Should not throw error
    });
  });

  describe('Utility methods', () => {
    test('getContext() should return canvas context', () => {
      expect(renderer.getContext()).toBe(canvas.context);
    });

    test('getCanvas() should return canvas element', () => {
      expect(renderer.getCanvas()).toBe(canvas);
    });

    test('resize() should update canvas dimensions', () => {
      renderer.resize(1024, 768);

      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
      expect(renderer.width).toBe(1024);
      expect(renderer.height).toBe(768);
    });
  });
});