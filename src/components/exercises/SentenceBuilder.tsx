/**
 * Sentence Builder Exercise Component
 * 
 * Interactive sentence building component where users arrange words
 * to form grammatically correct sentences.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { 
  SentenceBuilderProps, 
  ExerciseState, 
  FeedbackMessage,
  WordTileState 
} from './types';
import type { SentenceBuilderData } from '../../types/content';
import {
  createInitialExerciseState,
  updateExerciseState,
  useHint,
  validateAnswer,
  createExerciseAnswer,
  createFeedbackMessage,
  shuffleWords,
  getAriaLabel,
  getKeyboardInstructions,
  validateQuestionData,
} from './utils';

/**
 * Sentence Builder Exercise Component
 */
export function SentenceBuilder({
  question,
  onAnswer,
  onHintRequest,
  disabled = false,
  showFeedback = true,
  timeLimit,
  className = '',
}: SentenceBuilderProps) {
  // State management
  const [state, setState] = useState<ExerciseState>(createInitialExerciseState);
  const [availableWords, setAvailableWords] = useState<WordTileState[]>([]);
  const [selectedWords, setSelectedWords] = useState<WordTileState[]>([]);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [focusedWordIndex, setFocusedWordIndex] = useState<number>(0);
  const [focusArea, setFocusArea] = useState<'available' | 'selected'>('available');

  // Initialize word tiles
  useEffect(() => {
    const errors = validateQuestionData(question);
    if (errors.length > 0) {
      console.error('Sentence Builder question validation errors:', errors);
    }

    const data = question.questionData as SentenceBuilderData;
    const words = shuffleWords(data.words, data.shuffleWords !== false);
    
    const wordTiles: WordTileState[] = words.map((word, index) => ({
      id: `word-${index}`,
      word,
      position: index,
      isSelected: false,
      isPlaced: false,
    }));
    
    setAvailableWords(wordTiles);
    setSelectedWords([]);
  }, [question]);

  // Handle word selection
  const handleWordSelect = useCallback((wordTile: WordTileState) => {
    if (disabled || state.isAnswered) return;

    if (wordTile.isSelected) {
      // Remove from selected words
      setSelectedWords(prev => prev.filter(w => w.id !== wordTile.id));
      setAvailableWords(prev => [...prev, { ...wordTile, isSelected: false }].sort((a, b) => a.position - b.position));
    } else {
      // Add to selected words
      setSelectedWords(prev => [...prev, { ...wordTile, isSelected: true, isPlaced: true }]);
      setAvailableWords(prev => prev.filter(w => w.id !== wordTile.id));
    }
  }, [disabled, state.isAnswered]);

  // Handle word removal from sentence
  const handleWordRemove = useCallback((wordTile: WordTileState) => {
    if (disabled || state.isAnswered) return;
    handleWordSelect(wordTile);
  }, [disabled, state.isAnswered, handleWordSelect]);

  // Handle word reordering in selected words
  const handleWordReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (disabled || state.isAnswered) return;

    setSelectedWords(prev => {
      const newWords = [...prev];
      const [movedWord] = newWords.splice(fromIndex, 1);
      newWords.splice(toIndex, 0, movedWord);
      return newWords;
    });
  }, [disabled, state.isAnswered]);

  // Clear all selected words
  const handleClearAll = useCallback(() => {
    if (disabled || state.isAnswered) return;

    const wordsToReturn = selectedWords.map(w => ({ ...w, isSelected: false, isPlaced: false }));
    setAvailableWords(prev => [...prev, ...wordsToReturn].sort((a, b) => a.position - b.position));
    setSelectedWords([]);
  }, [disabled, state.isAnswered, selectedWords]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (disabled || state.isAnswered) return;

    // Check if any words are selected
    if (selectedWords.length === 0) {
      setFeedback({
        type: 'incorrect',
        title: 'No sentence built',
        message: 'Please arrange words to form a sentence before submitting.',
        isVisible: true,
        points: 0,
      });
      return;
    }

    // Build the sentence from selected words
    const userSentence = selectedWords.map(w => w.word).join(' ');

    // Validate answer
    const validation = validateAnswer(question, userSentence, state.hintsUsed, state.timeSpent);
    const newState = updateExerciseState(state, userSentence, validation.isCorrect);
    
    setState(newState);

    // Mark correct positions if answered correctly
    if (validation.isCorrect) {
      setSelectedWords(prev => prev.map(w => ({ ...w, isCorrectPosition: true })));
    }

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
      userSentence,
      validation,
      newState.timeSpent,
      newState.hintsUsed
    );

    onAnswer(answer);
  }, [disabled, state, selectedWords, question, showFeedback, onAnswer]);

  // Handle hint request
  const handleHintRequest = useCallback(() => {
    if (!onHintRequest || disabled) return;
    
    setState(useHint);
    onHintRequest();
  }, [onHintRequest, disabled]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, area: 'available' | 'selected', index: number) => {
    if (disabled || state.isAnswered) return;

    const words = area === 'available' ? availableWords : selectedWords;
    const currentWord = words[index];

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (area === 'selected' && index > 0) {
          setFocusedWordIndex(index - 1);
        } else if (area === 'available') {
          const newIndex = index > 0 ? index - 1 : words.length - 1;
          setFocusedWordIndex(newIndex);
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (area === 'selected' && index < words.length - 1) {
          setFocusedWordIndex(index + 1);
        } else if (area === 'available') {
          const newIndex = index < words.length - 1 ? index + 1 : 0;
          setFocusedWordIndex(newIndex);
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        // Switch between available and selected areas
        setFocusArea(area === 'available' ? 'selected' : 'available');
        setFocusedWordIndex(0);
        break;

      case ' ':
      case 'Space':
      case 'Enter':
        event.preventDefault();
        if (currentWord) {
          handleWordSelect(currentWord);
        }
        break;

      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if (area === 'selected' && currentWord) {
          handleWordRemove(currentWord);
        }
        break;

      case 'h':
      case 'H':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleHintRequest();
        }
        break;
    }
  }, [disabled, state.isAnswered, availableWords, selectedWords, handleWordSelect, handleWordRemove, handleHintRequest]);

  return (
    <Card className={`sentence-builder-exercise ${className}`}>
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
        {/* Selected words (sentence being built) */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Your sentence:</h4>
          <div 
            className={`
              min-h-[60px] p-4 border-2 rounded-lg
              ${selectedWords.length === 0 ? 'border-dashed border-gray-300 bg-gray-50' : 'border-solid border-blue-400 bg-blue-50'}
              ${state.isAnswered && state.isCorrect ? 'border-green-500 bg-green-50' : ''}
              ${state.isAnswered && !state.isCorrect ? 'border-red-500 bg-red-50' : ''}
            `}
            role="region"
            aria-label="Sentence being built"
          >
            {selectedWords.length === 0 ? (
              <p className="text-gray-400 text-center">Click words below to build your sentence</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedWords.map((word, index) => (
                  <button
                    key={word.id}
                    onClick={() => handleWordRemove(word)}
                    onKeyDown={(e) => handleKeyDown(e, 'selected', index)}
                    disabled={disabled || state.isAnswered}
                    tabIndex={focusArea === 'selected' && focusedWordIndex === index ? 0 : -1}
                    className={`
                      px-3 py-2 bg-white border-2 rounded-lg
                      transition-all duration-200
                      ${word.isCorrectPosition ? 'border-green-500 bg-green-100' : 'border-blue-400'}
                      ${focusArea === 'selected' && focusedWordIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                      ${disabled || state.isAnswered ? 'cursor-default' : 'cursor-pointer hover:bg-blue-100'}
                    `}
                    aria-label={`Word in sentence: ${word.word}. Press Delete to remove.`}
                  >
                    <span className="text-sm font-medium">{word.word}</span>
                    {!state.isAnswered && (
                      <span className="ml-2 text-red-500">×</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available words */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">Available words:</h4>
            {selectedWords.length > 0 && !state.isAnswered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={disabled}
                className="clear-button"
              >
                Clear All
              </Button>
            )}
          </div>
          <div 
            className="flex flex-wrap gap-2"
            role="list"
            aria-label="Available words to choose from"
          >
            {availableWords.map((word, index) => (
              <button
                key={word.id}
                onClick={() => handleWordSelect(word)}
                onKeyDown={(e) => handleKeyDown(e, 'available', index)}
                disabled={disabled || state.isAnswered}
                tabIndex={focusArea === 'available' && focusedWordIndex === index ? 0 : -1}
                className={`
                  px-3 py-2 bg-white border-2 rounded-lg
                  transition-all duration-200
                  ${focusArea === 'available' && focusedWordIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  ${disabled || state.isAnswered ? 'cursor-default opacity-50' : 'cursor-pointer hover:bg-gray-100 hover:border-gray-400'}
                  border-gray-300
                `}
                aria-label={`Available word: ${word.word}. Press Space to add to sentence.`}
              >
                <span className="text-sm font-medium">{word.word}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard instructions */}
        <div className="mt-4 text-xs text-gray-500">
          {getKeyboardInstructions('sentence_builder')}
          <br />
          Tip: Use arrow keys to navigate, space to select/deselect words
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
            {feedback.details && (
              <div className="mt-2 text-sm">{feedback.details}</div>
            )}
            {feedback.points !== undefined && (
              <div className="mt-2 text-sm font-medium">
                Points earned: {feedback.points.toFixed(2)} / {question.points}
              </div>
            )}
            {state.isAnswered && !state.isCorrect && question.correctAnswer && (
              <div className="mt-3 p-2 bg-white rounded border border-gray-300">
                <div className="text-sm font-medium mb-1">Correct answer:</div>
                <div className="text-sm">{question.correctAnswer.toString()}</div>
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
            Words used: {selectedWords.length} / {availableWords.length + selectedWords.length}
          </div>
          {state.hintsUsed > 0 && (
            <div>Hints used: {state.hintsUsed}</div>
          )}
          {timeLimit && (
            <div>Time limit: {timeLimit} seconds</div>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
}

// Default export
export default SentenceBuilder;