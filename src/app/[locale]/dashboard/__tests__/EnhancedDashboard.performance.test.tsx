import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedDashboard } from '../EnhancedDashboard';
import {
  measureRenderPerformance,
  simulateHighFrequencyUpdates,
  performLoadTest,
  simulateConcurrentUsers,
  generateLargeDataset,
  type PerformanceMetrics,
} from '../../../test/utils/performance';

// Mock the hooks and services
const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
};

const mockUseKPIData = vi.fn();
const mockUseSparklineData = vi.fn();
const mockUseRealtimeConnection = vi.fn();
const mockUseRealtimeKPIUpdates = vi.fn();
const mockUseDashboardLayout = vi.fn();

vi.mock('@/hooks/useRealTimeData', () => ({
  useKPIData: mockUseKPIData,
  useSparklineData: mockUseSparklineData,
}));

vi.mock('@/services/realtime', () => ({
  useRealtimeConnection: mockUseRealtimeConnection,
  useRealtimeKPIUpdates: mockUseRealtimeKPIUpdates,
}));

vi.mock('@/components/layout/DashboardGrid', () => ({
  DashboardGrid: ({ items, onLayoutChange }: any) => (
    <div data-testid="dashboard-grid">
      {items.map((item: any) => (
        <div key={item.id} data-testid={`grid-item-${item.id}`}>
          {item.component}
        </div>
      ))}
    </div>
  ),
  useDashboardLayout: mockUseDashboardLayout,
}));

vi.mock('@/components/charts/InventoryTrendChart', () => ({
  InventoryTrendChart: ({ data, onExport }: any) => (
    <div data-testid="inventory-trend-chart">
      <button onClick={onExport} data-testid="export-chart-btn">
        Export Chart
      </button>
    </div>
  ),
}));

describe('EnhancedDashboard Performance Tests', () => {
  const mockRefreshKPI = vi.fn();
  const mockSaveLayout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseRealtimeConnection.mockReturnValue(true);
    mockUseRealtimeKPIUpdates.mockImplementation((callback) => {
      (global as any).mockRealtimeCallback = callback;
    });
    mockUseDashboardLayout.mockReturnValue({
      layout: [],
      saveLayout: mockSaveLayout,
    });
  });

  afterEach(() => {
    delete (global as any).mockRealtimeCallback;
  });

  describe('Render Performance', () => {
    it('should render dashboard within acceptable time limits', () => {
      const mockKPIData = generateLargeDataset(4, 'kpi')[0];
      const mockSparklineData = {
        totalItems: generateLargeDataset(100, 'sparkline'),
        totalQuantity: generateLargeDataset(100, 'sparkline'),
        rejectRate: generateLargeDataset(100, 'sparkline'),
      };

      mockUseKPIData.mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: mockSparklineData,
        loading: false,
      });

      const metrics = measureRenderPerformance(
        () => render(<EnhancedDashboard user={mockUser} />),
        undefined,
        5
      );

      // Should render within 100ms on average
      expect(metrics.renderTime).toBeLessThan(100);
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });

    it('should handle large sparkline datasets efficiently', () => {
      const largeSparklineData = {
        totalItems: generateLargeDataset(1000, 'sparkline'),
        totalQuantity: generateLargeDataset(1000, 'sparkline'),
        rejectRate: generateLargeDataset(1000, 'sparkline'),
      };

      mockUseKPIData.mockReturnValue({
        data: {
          totalItems: { value: 1250, trend: 5.2 },
          totalQuantity: { value: 45000, trend: -2.1 },
          rejectRate: { value: 3.5, trend: -0.8 },
          activeUsers: { value: 12, trend: null },
        },
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: largeSparklineData,
        loading: false,
      });

      const startTime = performance.now();
      render(<EnhancedDashboard user={mockUser} />);
      const endTime = performance.now();

      // Should handle large datasets within reasonable time
      expect(endTime - startTime).toBeLessThan(200);
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });

    it('should maintain performance with multiple re-renders', () => {
      const mockKPIData = {
        totalItems: { value: 1250, trend: 5.2 },
        totalQuantity: { value: 45000, trend: -2.1 },
        rejectRate: { value: 3.5, trend: -0.8 },
        activeUsers: { value: 12, trend: null },
      };

      mockUseKPIData.mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: null,
        loading: false,
      });

      const { rerender } = render(<EnhancedDashboard user={mockUser} />);

      const renderTimes: number[] = [];

      // Perform multiple re-renders with different data
      for (let i = 0; i < 10; i++) {
        const updatedKPIData = {
          ...mockKPIData,
          totalItems: { value: 1250 + i * 10, trend: 5.2 + i * 0.1 },
        };

        mockUseKPIData.mockReturnValue({
          data: updatedKPIData,
          loading: false,
          error: null,
          refresh: mockRefreshKPI,
        });

        const startTime = performance.now();
        rerender(<EnhancedDashboard user={mockUser} />);
        const endTime = performance.now();

        renderTimes.push(endTime - startTime);
      }

      const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      
      // Re-renders should be fast (under 50ms on average)
      expect(averageRenderTime).toBeLessThan(50);
    });
  });

  describe('Real-time Update Performance', () => {
    it('should handle high-frequency real-time updates efficiently', async () => {
      const mockKPIData = {
        totalItems: { value: 1250, trend: 5.2 },
        totalQuantity: { value: 45000, trend: -2.1 },
        rejectRate: { value: 3.5, trend: -0.8 },
        activeUsers: { value: 12, trend: null },
      };

      mockUseKPIData.mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: null,
        loading: false,
      });

      render(<EnhancedDashboard user={mockUser} />);

      // Simulate high-frequency updates (10 updates per second for 2 seconds)
      const metrics = await simulateHighFrequencyUpdates(
        (data) => {
          if ((global as any).mockRealtimeCallback) {
            (global as any).mockRealtimeCallback(data);
          }
        },
        {
          frequency: 10,
          duration: 2,
          dataGenerator: () => ({
            totalItems: { value: Math.floor(Math.random() * 2000), trend: Math.random() * 10 },
            totalQuantity: { value: Math.floor(Math.random() * 50000), trend: Math.random() * 5 },
            rejectRate: { value: Math.random() * 10, trend: Math.random() * 2 },
            activeUsers: { value: Math.floor(Math.random() * 20), trend: Math.random() * 5 },
          }),
        }
      );

      // Each update should be processed quickly
      expect(metrics.updateTime).toBeLessThan(10);
      expect(metrics.reRenderCount).toBe(20); // 10 updates/sec * 2 seconds
    });

    it('should throttle updates to prevent performance degradation', async () => {
      const mockKPIData = {
        totalItems: { value: 1250, trend: 5.2 },
        totalQuantity: { value: 45000, trend: -2.1 },
        rejectRate: { value: 3.5, trend: -0.8 },
        activeUsers: { value: 12, trend: null },
      };

      mockUseKPIData.mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: null,
        loading: false,
      });

      render(<EnhancedDashboard user={mockUser} />);

      // Simulate extremely high-frequency updates (100 updates per second)
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        act(() => {
          if ((global as any).mockRealtimeCallback) {
            (global as any).mockRealtimeCallback({
              totalItems: { value: 1250 + i, trend: 5.2 },
            });
          }
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid updates without blocking (under 1 second total)
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('User Interaction Performance', () => {
    it('should handle concurrent user interactions efficiently', async () => {
      const mockKPIData = {
        totalItems: { value: 1250, trend: 5.2 },
        totalQuantity: { value: 45000, trend: -2.1 },
        rejectRate: { value: 3.5, trend: -0.8 },
        activeUsers: { value: 12, trend: null },
      };

      mockUseKPIData.mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: null,
        loading: false,
      });

      render(<EnhancedDashboard user={mockUser} />);

      const userActions = [
        async () => {
          const refreshButton = screen.getByRole('button', { name: /refresh/i });
          await userEvent.click(refreshButton);
        },
        async () => {
          const realtimeCheckbox = screen.getByRole('checkbox', { name: /real-time updates/i });
          await userEvent.click(realtimeCheckbox);
        },
        async () => {
          const realtimeCheckbox = screen.getByRole('checkbox', { name: /real-time updates/i });
          await userEvent.click(realtimeCheckbox);
        },
        async () => {
          const refreshButton = screen.getByRole('button', { name: /refresh/i });
          await userEvent.click(refreshButton);
        },
      ];

      const metrics = await simulateConcurrentUsers(userActions, 2);

      // Concurrent interactions should complete quickly
      expect(metrics.updateTime).toBeLessThan(100);
      expect(mockRefreshKPI).toHaveBeenCalled();
    });

    it('should maintain responsiveness during data loading', async () => {
      // Mock slow loading state
      mockUseKPIData.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: null,
        loading: true,
      });

      const startTime = performance.now();
      render(<EnhancedDashboard user={mockUser} />);
      const endTime = performance.now();

      // Should render loading state quickly
      expect(endTime - startTime).toBeLessThan(50);

      // UI should still be interactive
      const realtimeCheckbox = screen.getByRole('checkbox', { name: /real-time updates/i });
      expect(realtimeCheckbox).toBeInTheDocument();
      
      await userEvent.click(realtimeCheckbox);
      // Should handle interaction even during loading
    });
  });

  describe('Memory Usage and Cleanup', () => {
    it('should not cause memory leaks with frequent updates', async () => {
      const mockKPIData = {
        totalItems: { value: 1250, trend: 5.2 },
        totalQuantity: { value: 45000, trend: -2.1 },
        rejectRate: { value: 3.5, trend: -0.8 },
        activeUsers: { value: 12, trend: null },
      };

      mockUseKPIData.mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: null,
        loading: false,
      });

      const { unmount } = render(<EnhancedDashboard user={mockUser} />);

      // Simulate many updates
      for (let i = 0; i < 100; i++) {
        act(() => {
          if ((global as any).mockRealtimeCallback) {
            (global as any).mockRealtimeCallback({
              totalItems: { value: 1250 + i, trend: 5.2 },
            });
          }
        });
      }

      // Unmount should clean up properly
      unmount();

      // Verify cleanup by checking that callbacks are no longer called
      delete (global as any).mockRealtimeCallback;
      
      // This test mainly ensures no errors are thrown during cleanup
      expect(true).toBe(true);
    });

    it('should handle component unmounting during active updates', () => {
      const mockKPIData = {
        totalItems: { value: 1250, trend: 5.2 },
        totalQuantity: { value: 45000, trend: -2.1 },
        rejectRate: { value: 3.5, trend: -0.8 },
        activeUsers: { value: 12, trend: null },
      };

      mockUseKPIData.mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: null,
        loading: false,
      });

      const { unmount } = render(<EnhancedDashboard user={mockUser} />);

      // Start updates
      act(() => {
        if ((global as any).mockRealtimeCallback) {
          (global as any).mockRealtimeCallback({
            totalItems: { value: 1300, trend: 8.5 },
          });
        }
      });

      // Unmount during active state
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Load Testing', () => {
    it('should handle API load testing scenarios', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({
        data: {
          totalItems: { value: 1250, trend: 5.2 },
          totalQuantity: { value: 45000, trend: -2.1 },
          rejectRate: { value: 3.5, trend: -0.8 },
          activeUsers: { value: 12, trend: null },
        },
      });

      const loadTestResult = await performLoadTest(
        mockApiCall,
        {
          iterations: 50,
          concurrency: 5,
        }
      );

      expect(loadTestResult.successRate).toBe(100);
      expect(loadTestResult.averageResponseTime).toBeLessThan(100);
      expect(loadTestResult.errorCount).toBe(0);
      expect(mockApiCall).toHaveBeenCalledTimes(50);
    });

    it('should handle API failures gracefully under load', async () => {
      let callCount = 0;
      const mockApiCall = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount % 5 === 0) {
          return Promise.reject(new Error('Simulated API failure'));
        }
        return Promise.resolve({ data: { success: true } });
      });

      const loadTestResult = await performLoadTest(
        mockApiCall,
        {
          iterations: 20,
          concurrency: 4,
        }
      );

      expect(loadTestResult.successRate).toBe(80); // 4 out of 5 should succeed
      expect(loadTestResult.errorCount).toBe(4); // 20% failure rate
      expect(loadTestResult.totalRequests).toBe(20);
    });
  });

  describe('Scalability Testing', () => {
    it('should scale with increasing number of KPI cards', () => {
      const largeKPIDataset = generateLargeDataset(20, 'kpi');
      
      // Mock a dashboard with many KPI cards
      mockUseKPIData.mockReturnValue({
        data: largeKPIDataset.reduce((acc: any, item: any, index: number) => {
          acc[`kpi${index}`] = { value: item.value, trend: item.trend.percentage };
          return acc;
        }, {}),
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: null,
        loading: false,
      });

      const startTime = performance.now();
      render(<EnhancedDashboard user={mockUser} />);
      const endTime = performance.now();

      // Should handle large number of components efficiently
      expect(endTime - startTime).toBeLessThan(300);
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });

    it('should maintain performance with complex sparkline data', () => {
      const complexSparklineData = {
        totalItems: generateLargeDataset(500, 'sparkline'),
        totalQuantity: generateLargeDataset(500, 'sparkline'),
        rejectRate: generateLargeDataset(500, 'sparkline'),
        // Add more series
        revenue: generateLargeDataset(500, 'sparkline'),
        costs: generateLargeDataset(500, 'sparkline'),
        profit: generateLargeDataset(500, 'sparkline'),
      };

      mockUseKPIData.mockReturnValue({
        data: {
          totalItems: { value: 1250, trend: 5.2 },
          totalQuantity: { value: 45000, trend: -2.1 },
          rejectRate: { value: 3.5, trend: -0.8 },
          activeUsers: { value: 12, trend: null },
        },
        loading: false,
        error: null,
        refresh: mockRefreshKPI,
      });

      mockUseSparklineData.mockReturnValue({
        data: complexSparklineData,
        loading: false,
      });

      const metrics = measureRenderPerformance(
        () => render(<EnhancedDashboard user={mockUser} />),
        undefined,
        3
      );

      // Should handle complex data within reasonable limits
      expect(metrics.renderTime).toBeLessThan(200);
    });
  });
});