import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import InputHandler from '../src/InputHandler.js';
import Character from '../src/Character.js';

describe('InputHandler クラス / InputHandler Class', () => {
  let mockGameManager;
  let character;
  let inputHandler;

  beforeEach(() => {
    // Create a mock character
    character = new Character(100, 100, 10);
    
    // Create a mock game manager
    mockGameManager = {
      character: character,
      state: 'playing',
      getCurrentState: function() {
        return this.state;
      }
    };
    
    // Create input handler
    inputHandler = new InputHandler(mockGameManager);
  });

  afterEach(() => {
    // Clean up event listeners
    if (inputHandler) {
      inputHandler.disable();
    }
  });

  describe('Property-Based Tests', () => {
    
    /**
     * Feature: mouse-wire-game, Property 4: Input Gating by Game State
     * Validates: Requirements 1.5
     * 
     * Property 4: Input Gating by Game State（ゲーム状態による入力制御）
     * For any arrow key press when the game state is not 'playing', 
     * the character's position and direction should remain unchanged.
     */
    test('Property 4: Input Gating by Game State（ゲーム状態による入力制御）', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('menu', 'paused', 'gameover', 'victory'), // Non-playing states
          fc.constantFrom('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 5, max: 50 }),
          (gameState, keyPressed, x, y, size) => {
            // Set up character at random position
            const testCharacter = new Character(x, y, size);
            const testGameManager = {
              character: testCharacter,
              state: gameState,
              getCurrentState: function() {
                return this.state;
              }
            };
            
            const testInputHandler = new InputHandler(testGameManager);
            
            // Record initial state
            const initialPosition = testCharacter.getPosition();
            const initialDirection = testCharacter.direction;
            
            // Enable input handler
            testInputHandler.enable();
            
            // Simulate key press when game is not in 'playing' state
            const mockEvent = {
              key: keyPressed,
              preventDefault: jest.fn()
            };
            
            testInputHandler.handleKeyDown(mockEvent);
            
            // Verify that character position and direction remain unchanged
            const finalPosition = testCharacter.getPosition();
            const finalDirection = testCharacter.direction;
            
            expect(finalPosition.x).toBe(initialPosition.x);
            expect(finalPosition.y).toBe(initialPosition.y);
            expect(finalDirection).toBe(initialDirection);
            
            // Clean up
            testInputHandler.disable();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property test: Input acceptance during playing state
     * 追加のプロパティテスト: プレイ中状態での入力受け入れ
     */
    test('Property: Input Acceptance During Playing State（プレイ中状態での入力受け入れ）', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 5, max: 50 }),
          (keyPressed, x, y, size) => {
            // Set up character at random position
            const testCharacter = new Character(x, y, size);
            const testGameManager = {
              character: testCharacter,
              state: 'playing', // Game is in playing state
              getCurrentState: function() {
                return this.state;
              }
            };
            
            const testInputHandler = new InputHandler(testGameManager);
            
            // Record initial direction
            const initialDirection = testCharacter.direction;
            
            // Enable input handler
            testInputHandler.enable();
            
            // Simulate key press when game is in 'playing' state
            const mockEvent = {
              key: keyPressed,
              preventDefault: jest.fn()
            };
            
            testInputHandler.handleKeyDown(mockEvent);
            
            // Verify that character direction changed (input was accepted)
            const finalDirection = testCharacter.direction;
            const expectedDirection = testInputHandler.mapKeyToDirection(keyPressed);
            
            expect(finalDirection).toBe(expectedDirection);
            expect(finalDirection).not.toBe(initialDirection); // Direction should change
            
            // Verify preventDefault was called
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            
            // Clean up
            testInputHandler.disable();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property test: Key mapping consistency
     * プロパティテスト: キーマッピングの一貫性
     */
    test('Property: Key Mapping Consistency（キーマッピングの一貫性）', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'),
          (key) => {
            const testInputHandler = new InputHandler(mockGameManager);
            const direction = testInputHandler.mapKeyToDirection(key);
            
            // Verify consistent mapping
            const expectedMappings = {
              'ArrowUp': 'up',
              'ArrowDown': 'down',
              'ArrowLeft': 'left',
              'ArrowRight': 'right'
            };
            
            expect(direction).toBe(expectedMappings[key]);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property test: Non-arrow keys are ignored
     * プロパティテスト: 矢印キー以外は無視される
     */
    test('Property: Non-Arrow Keys Ignored（矢印キー以外は無視）', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constantFrom('a', 'b', 'c', 'Space', 'Enter', 'Escape', 'Tab'),
            fc.string({ minLength: 1, maxLength: 10 }).filter(key => 
              typeof key === 'string' && 
              !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) &&
              // Exclude JavaScript object method names that could be interpreted as functions
              !['valueOf', 'toString', 'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString'].includes(key)
            )
          ),
          (key) => {
            const testInputHandler = new InputHandler(mockGameManager);
            const direction = testInputHandler.mapKeyToDirection(key);
            
            // Non-arrow keys should return null
            expect(direction).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    test('should initialize with correct default values', () => {
      expect(inputHandler.enabled).toBe(false);
      expect(inputHandler.currentDirection).toBeNull();
      expect(inputHandler.gameManager).toBe(mockGameManager);
    });

    test('should enable and disable event listeners', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      // Enable
      inputHandler.enable();
      expect(inputHandler.enabled).toBe(true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', inputHandler.handleKeyDown);
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', inputHandler.handleKeyUp);

      // Disable
      inputHandler.disable();
      expect(inputHandler.enabled).toBe(false);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', inputHandler.handleKeyDown);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', inputHandler.handleKeyUp);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    test('should reset current direction', () => {
      inputHandler.currentDirection = 'up';
      inputHandler.reset();
      expect(inputHandler.currentDirection).toBeNull();
    });

    test('should return current direction', () => {
      inputHandler.currentDirection = 'right';
      expect(inputHandler.getCurrentDirection()).toBe('right');
    });
  });
});