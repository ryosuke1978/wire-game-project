import { describe, test, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import LevelGenerator from '../src/LevelGenerator.js';

describe('LevelGenerator クラス / LevelGenerator Class', () => {
  describe('Property-Based Tests', () => {
    
    /**
     * Feature: mouse-wire-game, Property 11: Difficulty Determines Level Properties
     * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
     * 
     * Property 11: Difficulty Determines Level Properties（難易度がレベル特性を決定）
     * For any difficulty level selection, the generated level should have path width 
     * and character speed matching the specifications for that difficulty 
     * (easy: 100px/2px, medium: 60px/3px, hard: 40px/4px, super-hard: 30px/6px).
     */
    test('Property 11: Difficulty Determines Level Properties（難易度がレベル特性を決定）', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('easy', 'medium', 'hard', 'super-hard'),
          fc.integer({ min: 400, max: 1200 }), // canvas width
          fc.integer({ min: 300, max: 800 }),  // canvas height
          (difficulty, width, height) => {
            // Create level generator with random canvas size and specific difficulty
            const generator = new LevelGenerator(width, height, difficulty);
            
            // Generate the level
            generator.generate();
            
            // Define expected values based on requirements
            const expectedSettings = {
              'easy': { pathWidth: 100, characterSpeed: 2 },
              'medium': { pathWidth: 60, characterSpeed: 3 },
              'hard': { pathWidth: 40, characterSpeed: 4 },
              'super-hard': { pathWidth: 30, characterSpeed: 6 }
            };
            
            const expected = expectedSettings[difficulty];
            
            // Verify path width matches difficulty specification
            expect(generator.getPathWidth()).toBe(expected.pathWidth);
            
            // Verify character speed matches difficulty specification
            expect(generator.getCharacterSpeed()).toBe(expected.characterSpeed);
            
            // Verify that level was generated (has walls, start, and goal)
            const walls = generator.getWalls();
            const startPosition = generator.getStartPosition();
            const goalPosition = generator.getGoalPosition();
            
            // Level should have walls
            expect(walls).toBeDefined();
            expect(Array.isArray(walls)).toBe(true);
            expect(walls.length).toBeGreaterThan(0);
            
            // Level should have start position
            expect(startPosition).toBeDefined();
            expect(typeof startPosition.x).toBe('number');
            expect(typeof startPosition.y).toBe('number');
            
            // Level should have goal position
            expect(goalPosition).toBeDefined();
            expect(typeof goalPosition.x).toBe('number');
            expect(typeof goalPosition.y).toBe('number');
            
            // Start should be on the left side of canvas
            expect(startPosition.x).toBeLessThan(width / 2);
            
            // Goal should be on the right side of canvas
            expect(goalPosition.x).toBeGreaterThan(width / 2);
            
            // All walls should have valid dimensions
            walls.forEach(wall => {
              expect(typeof wall.x).toBe('number');
              expect(typeof wall.y).toBe('number');
              expect(typeof wall.width).toBe('number');
              expect(typeof wall.height).toBe('number');
              expect(wall.width).toBeGreaterThan(0);
              expect(wall.height).toBeGreaterThan(0);
            });
            
            // Path should exist and have points
            const path = generator.getPath();
            expect(path).toBeDefined();
            expect(Array.isArray(path)).toBe(true);
            expect(path.length).toBeGreaterThan(0);
            
            // All path points should be within canvas bounds
            path.forEach(point => {
              expect(point.x).toBeGreaterThanOrEqual(0);
              expect(point.x).toBeLessThanOrEqual(width);
              expect(point.y).toBeGreaterThanOrEqual(0);
              expect(point.y).toBeLessThanOrEqual(height);
            });
            
            // Waypoints should exist
            const waypoints = generator.getWaypoints();
            expect(waypoints).toBeDefined();
            expect(Array.isArray(waypoints)).toBe(true);
            expect(waypoints.length).toBeGreaterThanOrEqual(2); // At least start and goal
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    test('should throw error for invalid difficulty', () => {
      expect(() => {
        new LevelGenerator(800, 600, 'invalid');
      }).toThrow('Invalid difficulty: invalid');
    });

    test('should initialize with correct difficulty settings', () => {
      const generator = new LevelGenerator(800, 600, 'easy');
      expect(generator.difficulty).toBe('easy');
      expect(generator.getPathWidth()).toBe(100);
      expect(generator.getCharacterSpeed()).toBe(2);
    });

    test('should generate level with all required components', () => {
      const generator = new LevelGenerator(800, 600, 'medium');
      generator.generate();
      
      expect(generator.getWalls().length).toBeGreaterThan(0);
      expect(generator.getStartPosition()).toBeDefined();
      expect(generator.getGoalPosition()).toBeDefined();
      expect(generator.getPath().length).toBeGreaterThan(0);
      expect(generator.getWaypoints().length).toBeGreaterThanOrEqual(2);
    });

    test('should place start position on left side', () => {
      const generator = new LevelGenerator(800, 600, 'hard');
      generator.generate();
      
      const start = generator.getStartPosition();
      expect(start.x).toBeLessThan(400); // Left half of 800px canvas
    });

    test('should place goal position on right side', () => {
      const generator = new LevelGenerator(800, 600, 'super-hard');
      generator.generate();
      
      const goal = generator.getGoalPosition();
      expect(goal.x).toBeGreaterThan(400); // Right half of 800px canvas
    });
  });
});