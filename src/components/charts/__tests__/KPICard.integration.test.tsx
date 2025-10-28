import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KPICard, type KPICardProps, type TrendData } from '../KPICard';

describe('KPICard Integration Tests', () => {
  const mockOnRefresh = vi.fn();
  const mockOnClick = vi.fn();
  const mockActionClick = vi.fn();

  const defaultProps: KPICardProps = {
    title: 'Test KPI',
    value: 1250,
    onRefresh: mockOnRefresh,
    onClick: mockOnClick,
  };

  const trendData: TrendData = {
    direction: 'up',
    percentage: 5.2,
    period: 'vs last month',
    isGood: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Real-time Updates', () => {
    it('should automatically refresh data at specified intervals', async () => {
      render(
        <KPICard
          {...defaultProps}
          realTimeUpdate={true}
          updateInterval={5000}
        />
      );

      // Fast-forward time to trigger refresh
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });

      // Fast-forward again
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(2);
      });
    });

    it('should show real-time indicator when enabled', () => {
      render(
        <KPICard
          {...defaultProps}
          realTimeUpdate={true}
        />
      );

      // Should show green dot indicator for real-time updates
      const indicator = document.querySelector('.bg-success-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should show refreshing indicator during updates', async () => {
      const slowRefresh = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <KPICard
          {...defaultProps}
          onRefresh={slowRefresh}
          realTimeUpdate={true}
          updateInterval={2000}
        />
      );

      // Trigger refresh
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should show refreshing indicator
      await waitFor(() => {
        const refreshingIndicator = document.querySelector('.bg-warning-500');
        expect(refreshingIndicator).toBeInTheDocument();
      });

      // Complete the refresh
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(slowRefresh).toHaveBeenCalled();
      });
    });

    it('should display last updated timestamp', async () => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      render(
        <KPICard
          {...defaultProps}
          realTimeUpdate={true}
        />
      );

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      expect(screen.getByText(/12:00:00/)).toBeInTheDocument();
    });

    it('should stop real-time updates when disabled', async () => {
      const { rerender } = render(
        <KPICard
          {...defaultProps}
          realTimeUpdate={true}
          updateInterval={1000}
        />
      );

      // Fast-forward to trigger one refresh
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });

      // Disable real-time updates
      rerender(
        <KPICard
          {...defaultProps}
          realTimeUpdate={false}
          updateInterval={1000}
        />
      );

      // Fast-forward again - should not trigger refresh
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should still be only 1 call
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Interactions', () => {
    it('should handle click events when clickable', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<KPICard {...defaultProps} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<KPICard {...defaultProps} />);

      const card = screen.getByRole('button');
      card.focus();
      
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    it('should handle manual refresh button', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <KPICard
          {...defaultProps}
          realTimeUpdate={false}
        />
      );

      const refreshButton = screen.getByTitle('Refresh data');
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle action button clicks', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const actions = [
        {
          label: 'View Details',
          onClick: mockActionClick,
          variant: 'primary' as const,
        },
      ];

      render(
        <KPICard
          {...defaultProps}
          actions={actions}
        />
      );

      const actionButton = screen.getByText('View Details');
      await user.click(actionButton);

      expect(mockActionClick).toHaveBeenCalledTimes(1);
      // Should not trigger card click
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should prevent card click when action buttons are clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const actions = [
        {
          label: 'Action',
          onClick: mockActionClick,
        },
      ];

      render(
        <KPICard
          {...defaultProps}
          actions={actions}
        />
      );

      const actionButton = screen.getByText('Action');
      await user.click(actionButton);

      expect(mockActionClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Data Display and Formatting', () => {
    it('should format numeric values correctly', () => {
      render(
        <KPICard
          {...defaultProps}
          value={1234567}
        />
      );

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('should use custom formatter when provided', () => {
      const formatter = (value: number) => `$${value.toFixed(2)}`;
      
      render(
        <KPICard
          {...defaultProps}
          value={1234.56}
          formatter={formatter}
        />
      );

      expect(screen.getByText('$1234.56')).toBeInTheDocument();
    });

    it('should display trend information correctly', () => {
      render(
        <KPICard
          {...defaultProps}
          trend={trendData}
        />
      );

      expect(screen.getByText('5.2%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('should show appropriate trend colors based on context', () => {
      // Test positive trend for regular metrics
      const { rerender } = render(
        <KPICard
          {...defaultProps}
          title="Revenue"
          trend={{ ...trendData, direction: 'up', isGood: true }}
        />
      );

      let trendElement = screen.getByText('5.2%').closest('div');
      expect(trendElement).toHaveClass('text-success-600');

      // Test negative trend for reject rate (should be good)
      rerender(
        <KPICard
          {...defaultProps}
          title="Reject Rate"
          trend={{ ...trendData, direction: 'down', isGood: true }}
        />
      );

      trendElement = screen.getByText('5.2%').closest('div');
      expect(trendElement).toHaveClass('text-success-600');
    });

    it('should display subtitle when provided', () => {
      render(
        <KPICard
          {...defaultProps}
          subtitle="Quality metric"
        />
      );

      expect(screen.getByText('Quality metric')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state correctly', () => {
      render(
        <KPICard
          {...defaultProps}
          loading={true}
        />
      );

      expect(screen.getByText('...')).toBeInTheDocument();
      
      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should display error state with retry option', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <KPICard
          {...defaultProps}
          error="Failed to load data"
        />
      );

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle refresh errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingRefresh = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <KPICard
          {...defaultProps}
          onRefresh={failingRefresh}
          realTimeUpdate={true}
          updateInterval={1000}
        />
      );

      // Trigger refresh
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(failingRefresh).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to refresh KPI data:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Sparkline Integration', () => {
    it('should render sparkline when data is provided', () => {
      const sparklineData = [100, 120, 110, 130, 125, 140, 135];
      
      render(
        <KPICard
          {...defaultProps}
          sparklineData={sparklineData}
        />
      );

      // Should render SVG sparkline
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should not render sparkline when loading', () => {
      const sparklineData = [100, 120, 110, 130, 125, 140, 135];
      
      render(
        <KPICard
          {...defaultProps}
          sparklineData={sparklineData}
          loading={true}
        />
      );

      // Should not render SVG when loading
      const svg = document.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });

    it('should handle empty sparkline data', () => {
      render(
        <KPICard
          {...defaultProps}
          sparklineData={[]}
        />
      );

      // Should not render SVG for empty data
      const svg = document.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should cleanup intervals on unmount', () => {
      const { unmount } = render(
        <KPICard
          {...defaultProps}
          realTimeUpdate={true}
          updateInterval={1000}
        />
      );

      // Trigger one refresh
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);

      // Unmount component
      unmount();

      // Advance time - should not trigger refresh after unmount
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid prop changes efficiently', () => {
      const { rerender } = render(
        <KPICard
          {...defaultProps}
          value={100}
        />
      );

      // Rapidly change values
      for (let i = 101; i <= 110; i++) {
        rerender(
          <KPICard
            {...defaultProps}
            value={i}
          />
        );
      }

      // Should display final value
      expect(screen.getByText('110')).toBeInTheDocument();
    });

    it('should debounce refresh calls appropriately', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <KPICard
          {...defaultProps}
          realTimeUpdate={false}
        />
      );

      const refreshButton = screen.getByTitle('Refresh data');

      // Click multiple times rapidly
      await user.click(refreshButton);
      await user.click(refreshButton);
      await user.click(refreshButton);

      // Should handle multiple clicks gracefully
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });
});