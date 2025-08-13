/**
 * Drag and Drop Exercise Component
 * 
 * Interactive drag-and-drop question component with keyboard navigation support,
 * touch device compatibility, and accessibility features.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { 
  DragAndDropProps, 
  ExerciseState, 
  FeedbackMessage,
  DraggableItemState,
  DropTargetState 
} from './types';
import type { DragAndDropData } from '../../types/content';
import {
  createInitialExerciseState,
  updateExerciseState,
  useHint,
  validateAnswer,
  createExerciseAnswer,
  createFeedbackMessage,
  getAriaLabel,
  getKeyboardInstructions,
  validateQuestionData,
} from './utils';

/**
 * Drag and Drop Exercise Component
 */
export function DragAndDrop({
  question,
  onAnswer,
  onHintRequest,
  disabled = false,
  showFeedback = true,
  timeLimit,
  className = '',
}: DragAndDropProps) {
  // State management
  const [state, setState] = useState<ExerciseState>(createInitialExerciseState);
  const [draggableItems, setDraggableItems] = useState<DraggableItemState[]>([]);
  const [dropTargets, setDropTargets] = useState<DropTargetState[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [focusedTargetId, setFocusedTargetId] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Initialize items and targets
  useEffect(() => {
    const errors = validateQuestionData(question);
    if (errors.length > 0) {
      console.error('Drag and Drop question validation errors:', errors);
    }

    const data = question.questionData as DragAndDropData;
    
    // Initialize draggable items
    const items: DraggableItemState[] = data.items.map((item, index) => ({
      id: item.id,
      content: item.content,
      category: item.category,
      position: { x: 0, y: 0 },
      isDragging: false,
      isPlaced: false,
      targetId: undefined,
    }));
    setDraggableItems(items);

    // Initialize drop targets
    const targets: DropTargetState[] = data.targets.map(target => ({
      id: target.id,
      label: target.label,
      acceptsCategory: target.acceptsCategory,
      placedItems: [],
      isActive: false,
      isHighlighted: false,
    }));
    setDropTargets(targets);
  }, [question]);

  // Handle drag start
  const handleDragStart = useCallback((itemId: string) => {
    if (disabled || state.isAnswered) return;
    
    setDraggedItem(itemId);
    setDraggableItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isDragging: true } : item
    ));
  }, [disabled, state.isAnswered]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDraggableItems(prev => prev.map(item => 
      ({ ...item, isDragging: false })
    ));
    setDropTargets(prev => prev.map(target => 
      ({ ...target, isActive: false, isHighlighted: false })
    ));
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (disabled || state.isAnswered || !draggedItem) return;

    setDropTargets(prev => prev.map(target => 
      target.id === targetId 
        ? { ...target, isHighlighted: true }
        : { ...target, isHighlighted: false }
    ));
  }, [disabled, state.isAnswered, draggedItem]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (disabled || state.isAnswered || !draggedItem) return;

    // Remove item from previous target if placed
    const previousTarget = draggableItems.find(item => item.id === draggedItem)?.targetId;
    if (previousTarget) {
      setDropTargets(prev => prev.map(target => 
        target.id === previousTarget
          ? { ...target, placedItems: target.placedItems.filter(id => id !== draggedItem) }
          : target
      ));
    }

    // Place item in new target
    setDraggableItems(prev => prev.map(item => 
      item.id === draggedItem 
        ? { ...item, isPlaced: true, targetId }
        : item
    ));

    setDropTargets(prev => prev.map(target => 
      target.id === targetId
        ? { ...target, placedItems: [...target.placedItems, draggedItem], isHighlighted: false }
        : target
    ));

    handleDragEnd();
  }, [disabled, state.isAnswered, draggedItem, draggableItems, handleDragEnd]);

  // Remove item from target (reset to unplaced)
  const handleRemoveItem = useCallback((itemId: string) => {
    if (disabled || state.isAnswered) return;

    const item = draggableItems.find(i => i.id === itemId);
    if (!item || !item.targetId) return;

    setDraggableItems(prev => prev.map(i => 
      i.id === itemId 
        ? { ...i, isPlaced: false, targetId: undefined }
        : i
    ));

    setDropTargets(prev => prev.map(target => 
      target.id === item.targetId
        ? { ...target, placedItems: target.placedItems.filter(id => id !== itemId) }
        : target
    ));
  }, [disabled, state.isAnswered, draggableItems]);

  // Handle keyboard navigation for items
  const handleItemKeyDown = useCallback((e: React.KeyboardEvent, itemId: string) => {
    if (disabled || state.isAnswered) return;

    const item = draggableItems.find(i => i.id === itemId);
    if (!item) return;

    switch (e.key) {
      case ' ':
      case 'Space':
        e.preventDefault();
        if (item.isPlaced) {
          handleRemoveItem(itemId);
        } else {
          setFocusedItemId(itemId);
          setFocusedTargetId(dropTargets[0]?.id || null);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedTargetId && !item.isPlaced) {
          handleDrop(e as any, focusedTargetId);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedItemId(null);
        setFocusedTargetId(null);
        break;
    }
  }, [disabled, state.isAnswered, draggableItems, dropTargets, focusedTargetId, handleRemoveItem, handleDrop]);

  // Handle keyboard navigation for targets
  const handleTargetKeyDown = useCallback((e: React.KeyboardEvent, targetId: string) => {
    if (disabled || state.isAnswered) return;

    const targetIndex = dropTargets.findIndex(t => t.id === targetId);
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (targetIndex > 0) {
          setFocusedTargetId(dropTargets[targetIndex - 1].id);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (targetIndex < dropTargets.length - 1) {
          setFocusedTargetId(dropTargets[targetIndex + 1].id);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedItemId) {
          handleDrop(e as any, targetId);
          setFocusedItemId(null);
          setFocusedTargetId(null);
        }
        break;
    }
  }, [disabled, state.isAnswered, dropTargets, focusedItemId, handleDrop]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (disabled || state.isAnswered) return;

    // Check if all items are placed
    const unplacedItems = draggableItems.filter(item => !item.isPlaced);
    if (unplacedItems.length > 0) {
      setFeedback({
        type: 'incorrect',
        title: 'Incomplete',
        message: `Please place all items. ${unplacedItems.length} item(s) remaining.`,
        isVisible: true,
        points: 0,
      });
      return;
    }

    // Build answer object (mapping of target to items)
    const userAnswer: Record<string, string[]> = {};
    dropTargets.forEach(target => {
      userAnswer[target.id] = target.placedItems;
    });

    // Validate answer
    const validation = validateAnswer(question, userAnswer, state.hintsUsed, state.timeSpent);
    const newState = updateExerciseState(state, userAnswer, validation.isCorrect);
    
    setState(newState);

    // Create and show feedback
    if (showFeedback) {
      const feedbackType = validation.isCorrect 
        ? 'correct' 
        : validation.partialCredit 
          ? 'partial' 
          : 'incorrect';
      const feedbackMessage = createFeedbackMessage(feedbackType, validation, state.hintsUsed);
      setFeedback(feedbackMessage);
    }

    // Create answer object and notify parent
    const answer = createExerciseAnswer(
      question.id,
      userAnswer,
      validation,
      newState.timeSpent,
      newState.hintsUsed
    );

    onAnswer(answer);
  }, [disabled, state, draggableItems, dropTargets, question, showFeedback, onAnswer]);

  // Handle hint request
  const handleHintRequest = useCallback(() => {
    if (!onHintRequest || disabled) return;
    
    setState(useHint);
    onHintRequest();
  }, [onHintRequest, disabled]);

  return (
    <Card className={`drag-and-drop-exercise ${className}`}>
      <Card.Header>
        <h3 className="text-lg font-semibold mb-2">
          {question.questionText}
        </h3>
        {question.description && (
          <p className="text-sm text-gray-600 mb-4">
            {question.description}
          </p>
        )}
      </Card.Header>

      <Card.Body>
        {/* Draggable Items */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Items to place:</h4>
          <div 
            className="flex flex-wrap gap-3"
            role="list"
            aria-label="Draggable items"
          >
            {draggableItems.filter(item => !item.isPlaced).map(item => (
              <div
                key={item.id}
                draggable={!disabled && !state.isAnswered}
                onDragStart={() => handleDragStart(item.id)}
                onDragEnd={handleDragEnd}
                onKeyDown={(e) => handleItemKeyDown(e, item.id)}
                tabIndex={disabled || state.isAnswered ? -1 : 0}
                role="button"
                aria-label={`Draggable item: ${item.content}`}
                aria-grabbed={item.isDragging}
                className={`
                  px-4 py-2 bg-white border-2 rounded-lg cursor-move
                  transition-all duration-200 select-none
                  ${item.isDragging ? 'opacity-50 scale-95' : ''}
                  ${focusedItemId === item.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  ${disabled || state.isAnswered ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md'}
                  border-gray-300 hover:border-blue-400
                `}
              >
                <span className="text-sm font-medium">{item.content}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drop Targets */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Drop zones:</h4>
          {dropTargets.map(target => (
            <div
              key={target.id}
              onDragOver={(e) => handleDragOver(e, target.id)}
              onDragLeave={() => setDropTargets(prev => prev.map(t => 
                t.id === target.id ? { ...t, isHighlighted: false } : t
              ))}
              onDrop={(e) => handleDrop(e, target.id)}
              onKeyDown={(e) => handleTargetKeyDown(e, target.id)}
              tabIndex={focusedItemId ? 0 : -1}
              role="region"
              aria-label={`Drop zone: ${target.label}`}
              className={`
                p-4 border-2 border-dashed rounded-lg min-h-[80px]
                transition-all duration-200
                ${target.isHighlighted ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                ${focusedTargetId === target.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${state.isAnswered ? 'bg-gray-50' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-700 mb-2">{target.label}</div>
              <div className="flex flex-wrap gap-2">
                {target.placedItems.map(itemId => {
                  const item = draggableItems.find(i => i.id === itemId);
                  if (!item) return null;
                  
                  return (
                    <div
                      key={itemId}
                      className={`
                        px-3 py-1 bg-white border rounded-md text-sm
                        ${state.isAnswered ? 'border-gray-300' : 'border-blue-400'}
                      `}
                    >
                      {item.content}
                      {!state.isAnswered && (
                        <button
                          onClick={() => handleRemoveItem(itemId)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          aria-label={`Remove ${item.content}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Keyboard instructions */}
        <div className="mt-4 text-xs text-gray-500">
          {getKeyboardInstructions('drag_and_drop')}
        </div>

        {/* Feedback display */}
        {feedback && feedback.isVisible && (
          <div
            className={`
              mt-4 p-4 rounded-lg border-l-4
              ${feedback.type === 'correct' ? 'bg-green-50 border-green-500 text-green-800' : ''}
              ${feedback.type === 'incorrect' ? 'bg-red-50 border-red-500 text-red-800' : ''}
              ${feedback.type === 'partial' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : ''}
            `}
            role="alert"
            aria-live="polite"
          >
            <div className="font-semibold">{feedback.title}</div>
            <div className="mt-1">{feedback.message}</div>
            {feedback.points !== undefined && (
              <div className="mt-2 text-sm font-medium">
                Points earned: {feedback.points.toFixed(2)} / {question.points}
              </div>
            )}
          </div>
        )}
      </Card.Body>

      <Card.Footer>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {/* Hint button */}
            {onHintRequest && !state.isAnswered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleHintRequest}
                disabled={disabled}
                className="hint-button"
                aria-label="Request hint"
              >
                💡 Hint ({state.hintsUsed})
              </Button>
            )}
          </div>

          {/* Submit button */}
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={disabled || state.isAnswered}
            className="submit-button"
            aria-label="Submit answer"
          >
            {state.isAnswered ? 'Submitted' : 'Submit Answer'}
          </Button>
        </div>

        {/* Progress indicators */}
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <div>
            Items placed: {draggableItems.filter(i => i.isPlaced).length} / {draggableItems.length}
          </div>
          {state.hintsUsed > 0 && (
            <div>Hints used: {state.hintsUsed}</div>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
}

// Default export
export default DragAndDrop;