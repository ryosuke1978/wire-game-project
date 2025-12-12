import { describe, test, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import CollisionDetector from '../src/CollisionDetector.js';
import Character from '../src/Character.js';

describe('CollisionDetector クラス / CollisionDetector Class', () => {
  describe('Property-Based Tests', () => {
    
    /**
     * Feature: mouse-wire-game, Property 5: Collision Triggers Game Over
     * Validates: Requirements 2.1
     * 
     * Property 5: Collision Triggers Game Over（衝突によるゲームオーバー）
     * For any character position that intersects with a wall boundary, 
     * the collision detector should return true for wall collision.
     */
    test('Property 5: Collision Triggers Game Over（衝突によるゲームオーバー）', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }), // character size
          fc.integer({ min: 50, max: 200 }), // wall width
          fc.integer({ min: 50, max: 200 }), // wall height
          fc.integer({ min: 0, max: 100 }), // wall x position
          fc.integer({ min: 0, max: 100 }), // wall y position
          (characterSize, wallWidth, wallHeight, wallX, wallY) => {
            // Create a wall
            const walls = [{
              x: wallX,
              y: wallY,
              width: wallWidth,
              height: wallHeight
            }];
            
            // Create a goal (not relevant for this test, but required by constructor)
            const goal = { x: 500, y: 500 };
            
            // Test case 1: Character positioned to intersect with wall
            // Place character so it overlaps with the wall
            const overlappingX = wallX + wallWidth / 2 - characterSize / 2;
            const overlappingY = wallY + wallHeight / 2 - characterSize / 2;
            
            const overlappingCharacter = new Character(overlappingX, overlappingY, characterSize);
            const collisionDetector1 = new CollisionDetector(overlappingCharacter, walls, goal);
            
            // Should detect collision when character intersects wall
            expect(collisionDetector1.checkWallCollision()).toBe(true);
            
            // Should store collision point
            const collisionPoint = collisionDetector1.getCollisionPoint();
            expect(collisionPoint).not.toBeNull();
            expect(typeof collisionPoint.x).toBe('number');
            expect(typeof collisionPoint.y).toBe('number');
            
            // Test case 2: Character positioned away from wall (no collision)
            // Place character far from the wall
            const safeX = wallX + wallWidth + characterSize + 10;
            const safeY = wallY + wallHeight + characterSize + 10;
            
            const safeCharacter = new Character(safeX, safeY, characterSize);
            const collisionDetector2 = new CollisionDetector(safeCharacter, walls, goal);
            
            // Should not detect collision when character is away from wall
            expect(collisionDetector2.checkWallCollision()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: mouse-wire-game, Property 7: Safe Path Allows Continuation
     * Validates: Requirements 2.4
     * 
     * Property 7: Safe Path Allows Continuation（安全通路での継続）
     * For any character position within the safe path boundaries (not intersecting walls), 
     * the collision detector should return false for wall collision.
     */
    test('Property 7: Safe Path Allows Continuation（安全通路での継続）', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 30 }), // character size
          fc.integer({ min: 100, max: 300 }), // safe area width
          fc.integer({ min: 100, max: 300 }), // safe area height
          (characterSize, safeWidth, safeHeight) => {
            // Create walls that form a safe rectangular area in the middle
            const wallThickness = 50;
            const safeAreaX = wallThickness;
            const safeAreaY = wallThickness;
            
            const walls = [
              // Top wall
              { x: 0, y: 0, width: safeWidth + 2 * wallThickness, height: wallThickness },
              // Bottom wall
              { x: 0, y: safeAreaY + safeHeight, width: safeWidth + 2 * wallThickness, height: wallThickness },
              // Left wall
              { x: 0, y: 0, width: wallThickness, height: safeHeight + 2 * wallThickness },
              // Right wall
              { x: safeAreaX + safeWidth, y: 0, width: wallThickness, height: safeHeight + 2 * wallThickness }
            ];
            
            const goal = { x: 1000, y: 1000 }; // Goal far away, not relevant for this test
            
            // Generate random positions within the safe area
            // Ensure character is fully within safe bounds
            const margin = characterSize;
            const minX = safeAreaX + margin;
            const maxX = safeAreaX + safeWidth - margin;
            const minY = safeAreaY + margin;
            const maxY = safeAreaY + safeHeight - margin;
            
            // Only test if safe area is large enough for character
            if (maxX > minX && maxY > minY) {
              const safeX = minX + Math.random() * (maxX - minX);
              const safeY = minY + Math.random() * (maxY - minY);
              
              const character = new Character(safeX, safeY, characterSize);
              const collisionDetector = new CollisionDetector(character, walls, goal);
              
              // Character in safe area should not collide with walls
              expect(collisionDetector.checkWallCollision()).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    let character;
    let walls;
    let goal;
    let collisionDetector;

    beforeEach(() => {
      character = new Character(100, 100, 20);
      walls = [
        { x: 50, y: 50, width: 100, height: 20 },
        { x: 200, y: 150, width: 50, height: 100 }
      ];
      goal = { x: 300, y: 300 };
      collisionDetector = new CollisionDetector(character, walls, goal);
    });

    test('should detect collision when character overlaps with wall', () => {
      // Position character to overlap with first wall
      character.x = 75;
      character.y = 55;
      
      expect(collisionDetector.checkWallCollision()).toBe(true);
    });

    test('should not detect collision when character is away from walls', () => {
      // Position character away from all walls
      character.x = 10;
      character.y = 10;
      
      expect(collisionDetector.checkWallCollision()).toBe(false);
    });

    test('should detect goal collision when character reaches goal', () => {
      // Position character at goal
      character.x = goal.x - 10;
      character.y = goal.y - 10;
      
      expect(collisionDetector.checkGoalCollision()).toBe(true);
    });

    test('should not detect goal collision when character is away from goal', () => {
      // Character is already positioned away from goal in beforeEach
      expect(collisionDetector.checkGoalCollision()).toBe(false);
    });

    test('should store collision point when wall collision occurs', () => {
      // Position character to overlap with wall
      character.x = 75;
      character.y = 55;
      
      collisionDetector.checkWallCollision();
      const collisionPoint = collisionDetector.getCollisionPoint();
      
      expect(collisionPoint).not.toBeNull();
      expect(collisionPoint.x).toBe(85); // character center x
      expect(collisionPoint.y).toBe(65); // character center y
    });

    test('should return null collision point when no collision', () => {
      // Position character away from walls
      character.x = 10;
      character.y = 10;
      
      collisionDetector.checkWallCollision();
      const collisionPoint = collisionDetector.getCollisionPoint();
      
      expect(collisionPoint).toBeNull();
    });

    test('should update walls correctly', () => {
      const newWalls = [{ x: 0, y: 0, width: 50, height: 50 }];
      collisionDetector.updateWalls(newWalls);
      
      expect(collisionDetector.walls).toBe(newWalls);
    });

    test('should update goal correctly', () => {
      const newGoal = { x: 400, y: 400 };
      collisionDetector.updateGoal(newGoal);
      
      expect(collisionDetector.goal).toBe(newGoal);
    });

    test('should reset collision state', () => {
      // Trigger a collision first
      character.x = 75;
      character.y = 55;
      collisionDetector.checkWallCollision();
      
      // Reset and verify collision point is cleared
      collisionDetector.reset();
      expect(collisionDetector.getCollisionPoint()).toBeNull();
    });
  });
});