/**
 * Mastery Indicator Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MasteryIndicator, getMasteryColor, getMasteryLabel, calculateMasteryProgress } from '../MasteryIndicator';
import type { MasteryData } from '../MasteryIndicator';

const mockMasteryData: MasteryData = {
  currentScore: 85,
  targetThreshold: 80,
  isAchieved: true,
  level: 'advanced',
  confidence: 0.9,
  attempts: 3,
  lastAssessment: '2023-01-01T00:00:00Z'
};

describe('MasteryIndicator', () => {
  describe('Progress variant', () => {
    it('renders progress indicator with default settings', () => {
      render(<MasteryIndicator data={mockMasteryData} />);
      
      expect(screen.getByText('Advanced Level')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('shows progress bar with correct width', () => {
      const { container } = render(<MasteryIndicator data={mockMasteryData} />);
      
      const progressBar = container.querySelector('[style*="width: 85%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('displays target threshold marker', () => {
      const { container } = render(<MasteryIndicator data={mockMasteryData} />);
      
      const thresholdMarker = container.querySelector('[style*="left: 80%"]');
      expect(thresholdMarker).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<MasteryIndicator data={mockMasteryData} showLabel={false} />);
      
      expect(screen.queryByText('Advanced Level')).not.toBeInTheDocument();
    });

    it('hides percentage when showPercentage is false', () => {
      render(<MasteryIndicator data={mockMasteryData} showPercentage={false} />);
      
      expect(screen.queryByText('85%')).not.toBeInTheDocument();
    });
  });

  describe('Badge variant', () => {
    it('renders badge with correct mastery level', () => {
      render(<MasteryIndicator data={mockMasteryData} variant="badge" />);
      
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('shows colored badge based on mastery level', () => {
      const { container } = render(<MasteryIndicator data={mockMasteryData} variant="badge" />);
      
      const badge = container.querySelector('.bg-green-500');
      expect(badge).toBeInTheDocument();
    });

    it('handles different sizes', () => {
      const { container } = render(
        <MasteryIndicator data={mockMasteryData} variant="badge" size="lg" />
      );
      
      const badge = container.querySelector('.w-12.h-12');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Compact variant', () => {
    it('renders compact progress bar', () => {
      render(<MasteryIndicator data={mockMasteryData} variant="compact" />);
      
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('shows target threshold line', () => {
      const { container } = render(<MasteryIndicator data={mockMasteryData} variant="compact" />);
      
      const thresholdLine = container.querySelector('[style*="left: 80%"]');
      expect(thresholdLine).toBeInTheDocument();
    });
  });

  describe('Detailed variant', () => {
    it('renders detailed view with all information', () => {
      render(<MasteryIndicator data={mockMasteryData} variant="detailed" />);
      
      expect(screen.getByText('Mastery Progress')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
      expect(screen.getByText('Current Score')).toBeInTheDocument();
      expect(screen.getByText('Target Threshold')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('shows achievement status when target is met', () => {
      render(<MasteryIndicator data={mockMasteryData} variant="detailed" />);
      
      expect(screen.getByText('✓ Target achieved!')).toBeInTheDocument();
    });

    it('shows points needed when target not met', () => {
      const notAchievedData = {
        ...mockMasteryData,
        currentScore: 70,
        isAchieved: false
      };
      
      render(<MasteryIndicator data={notAchievedData} variant="detailed" />);
      
      expect(screen.getByText('10 points needed')).toBeInTheDocument();
    });

    it('displays additional metrics when available', () => {
      render(<MasteryIndicator data={mockMasteryData} variant="detailed" />);
      
      expect(screen.getByText('Attempts:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Confidence:')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('shows next level information when not achieved', () => {
      const developingData = {
        ...mockMasteryData,
        currentScore: 60,
        isAchieved: false,
        level: 'developing'
      };
      
      render(<MasteryIndicator data={developingData} variant="detailed" />);
      
      expect(screen.getByText('Next Level:')).toBeInTheDocument();
      expect(screen.getByText('Proficient')).toBeInTheDocument();
    });

    it('shows description when enabled', () => {
      render(
        <MasteryIndicator 
          data={mockMasteryData} 
          variant="detailed" 
          showDescription={true} 
        />
      );
      
      expect(screen.getByText(/Strong mastery of the concept/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides screen reader descriptions', () => {
      render(<MasteryIndicator data={mockMasteryData} />);
      
      expect(document.body).toHaveTextContent('Advanced level at 85%');
      expect(document.body).toHaveTextContent('Target of 80% achieved');
    });

    it('includes appropriate ARIA labels', () => {
      render(<MasteryIndicator data={mockMasteryData} variant="badge" />);
      
      const badge = screen.getByRole('generic', { hidden: true });
      expect(badge).toHaveAttribute('title');
    });
  });

  describe('Edge cases', () => {
    it('handles score of 0', () => {
      const zeroScoreData = {
        ...mockMasteryData,
        currentScore: 0,
        isAchieved: false,
        level: 'novice'
      };
      
      render(<MasteryIndicator data={zeroScoreData} />);
      
      expect(screen.getByText('Novice Level')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles score of 100', () => {
      const perfectScoreData = {
        ...mockMasteryData,
        currentScore: 100,
        level: 'expert'
      };
      
      render(<MasteryIndicator data={perfectScoreData} />);
      
      expect(screen.getByText('Expert Level')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles missing optional data', () => {
      const minimalData = {
        currentScore: 75,
        targetThreshold: 80,
        isAchieved: false,
        level: 'proficient'
      };
      
      render(<MasteryIndicator data={minimalData} variant="detailed" />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.queryByText('Attempts:')).not.toBeInTheDocument();
      expect(screen.queryByText('Confidence:')).not.toBeInTheDocument();
    });
  });

  describe('Utility functions', () => {
    describe('getMasteryColor', () => {
      it('returns correct colors for different scores', () => {
        expect(getMasteryColor(30)).toBe('bg-yellow-400'); // Developing
        expect(getMasteryColor(75)).toBe('bg-blue-500');   // Proficient
        expect(getMasteryColor(90)).toBe('bg-green-500');  // Advanced
        expect(getMasteryColor(98)).toBe('bg-purple-500'); // Expert
      });
    });

    describe('getMasteryLabel', () => {
      it('returns correct labels for different scores', () => {
        expect(getMasteryLabel(30)).toBe('Developing');
        expect(getMasteryLabel(75)).toBe('Proficient');
        expect(getMasteryLabel(90)).toBe('Advanced');
        expect(getMasteryLabel(98)).toBe('Expert');
      });
    });

    describe('calculateMasteryProgress', () => {
      it('calculates progress correctly', () => {
        const progress = calculateMasteryProgress(75, 80);
        
        expect(progress.percentage).toBe(93.75);
        expect(progress.isAchieved).toBe(false);
        expect(progress.pointsNeeded).toBe(5);
      });

      it('handles achieved mastery', () => {
        const progress = calculateMasteryProgress(85, 80);
        
        expect(progress.percentage).toBe(100);
        expect(progress.isAchieved).toBe(true);
        expect(progress.pointsNeeded).toBe(0);
      });

      it('caps percentage at 100', () => {
        const progress = calculateMasteryProgress(150, 80);
        
        expect(progress.percentage).toBe(100);
        expect(progress.isAchieved).toBe(true);
      });
    });
  });

  describe('Custom styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <MasteryIndicator data={mockMasteryData} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies different sizes correctly', () => {
      render(<MasteryIndicator data={mockMasteryData} size="lg" />);
      
      expect(screen.getByText('Advanced Level')).toHaveClass('text-lg');
    });

    it('handles animation properly', () => {
      const { container } = render(
        <MasteryIndicator data={mockMasteryData} animated={true} />
      );
      
      const progressBar = container.querySelector('.animate-pulse');
      expect(progressBar).toBeInTheDocument();
    });
  });
});