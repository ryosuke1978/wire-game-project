import { describe, test, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import Character from '../src/Character.js';

describe('Character クラス / Character Class', () => {
  describe('Property-Based Tests', () => {
    
    /**
     * Feature: mouse-wire-game, Property 1: Direction Change Correspondence
     * Validates: Requirements 1.1
     * 
     * Property 1: Direction Change Correspondence（方向変更の対応）
     * For any arrow key press during gameplay, the character's movement direction 
     * should immediately change to match the pressed key's direction (up/down/left/right).
     */
    test('Property 1: Direction Change Correspondence（方向変更の対応）', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('up', 'down', 'left', 'right'),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 5, max: 50 }),
          (direction, x, y, size) => {
            // Create a character at random position
            const character = new Character(x, y, size);
            
            // Set direction (simulating arrow key press)
            character.setDirection(direction);
            
            // Verify the character's direction matches the input
            expect(character.direction).toBe(direction);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: mouse-wire-game, Property 2: Continuous Movement Persistence
     * Validates: Requirements 1.2
     * 
     * Property 2: Continuous Movement Persistence（連続移動の持続）
     * For any set direction, the character should continue moving in that direction 
     * at constant speed across multiple game updates until a different arrow key is pressed.
     */
    test('Property 2: Continuous Movement Persistence（連続移動の持続）', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('up', 'down', 'left', 'right'),
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 5, max: 50 }),
          fc.integer({ min: 1, max: 10 }), // speed
          fc.integer({ min: 2, max: 10 }), // number of updates
          (direction, x, y, size, speed, numUpdates) => {
            const character = new Character(x, y, size);
            character.setDirection(direction);
            
            const initialPos = character.getPosition();
            const positions = [{ ...initialPos }];
            
            // Perform multiple updates without changing direction
            for (let i = 0; i < numUpdates; i++) {
              character.update(speed);
              positions.push({ ...character.getPosition() });
            }
            
            // Calculate expected displacement per update
            const expectedDisplacement = speed;
            
            // Verify movement is continuous and in the correct direction
            for (let i = 1; i < positions.length; i++) {
              const prev = positions[i - 1];
              const curr = positions[i];
              
              switch (direction) {
                case 'up':
                  expect(curr.y).toBe(prev.y - expectedDisplacement);
                  expect(curr.x).toBe(prev.x); // x should not change
                  break;
                case 'down':
                  expect(curr.y).toBe(prev.y + expectedDisplacement);
                  expect(curr.x).toBe(prev.x);
                  break;
                case 'left':
                  expect(curr.x).toBe(prev.x - expectedDisplacement);
                  expect(curr.y).toBe(prev.y); // y should not change
                  break;
                case 'right':
                  expect(curr.x).toBe(prev.x + expectedDisplacement);
                  expect(curr.y).toBe(prev.y);
                  break;
              }
            }
            
            // Verify total displacement is correct
            const finalPos = positions[positions.length - 1];
            const totalDisplacement = speed * numUpdates;
            
            switch (direction) {
              case 'up':
                expect(finalPos.y).toBe(initialPos.y - totalDisplacement);
                break;
              case 'down':
                expect(finalPos.y).toBe(initialPos.y + totalDisplacement);
                break;
              case 'left':
                expect(finalPos.x).toBe(initialPos.x - totalDisplacement);
                break;
              case 'right':
                expect(finalPos.x).toBe(initialPos.x + totalDisplacement);
                break;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: mouse-wire-game, Property 3: Direction Change Without Stop
     * Validates: Requirements 1.4
     * 
     * Property 3: Direction Change Without Stop（停止なしの方向変更）
     * For any direction change, the character's speed should remain constant 
     * before and after the change, with only the direction vector changing.
     */
    test('Property 3: Direction Change Without Stop（停止なしの方向変更）', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('up', 'down', 'left', 'right'),
          fc.constantFrom('up', 'down', 'left', 'right'),
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 5, max: 50 }),
          fc.integer({ min: 1, max: 10 }), // speed
          (direction1, direction2, x, y, size, speed) => {
            const character = new Character(x, y, size);
            
            // Set initial direction and move
            character.setDirection(direction1);
            const pos1 = character.getPosition();
            character.update(speed);
            const pos2 = character.getPosition();
            
            // Calculate displacement for first direction
            const displacement1 = calculateDisplacement(pos1, pos2);
            
            // Change direction immediately (without stopping)
            character.setDirection(direction2);
            const pos3 = character.getPosition();
            character.update(speed);
            const pos4 = character.getPosition();
            
            // Calculate displacement for second direction
            const displacement2 = calculateDisplacement(pos3, pos4);
            
            // Verify that the magnitude of displacement (speed) remains constant
            expect(displacement1.magnitude).toBe(speed);
            expect(displacement2.magnitude).toBe(speed);
            
            // Verify that direction changed correctly
            expect(displacement2.direction).toBe(direction2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Helper function to calculate displacement between two positions
 * @param {{x: number, y: number}} pos1 - Starting position
 * @param {{x: number, y: number}} pos2 - Ending position
 * @returns {{magnitude: number, direction: string}} Displacement info
 */
function calculateDisplacement(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  
  let magnitude = 0;
  let direction = null;
  
  if (dx > 0) {
    magnitude = dx;
    direction = 'right';
  } else if (dx < 0) {
    magnitude = -dx;
    direction = 'left';
  } else if (dy > 0) {
    magnitude = dy;
    direction = 'down';
  } else if (dy < 0) {
    magnitude = -dy;
    direction = 'up';
  }
  
  return { magnitude, direction };
}
