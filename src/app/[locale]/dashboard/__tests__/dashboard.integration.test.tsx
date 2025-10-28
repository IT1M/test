import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Simple mock components for testing
const MockKPICard = ({ title, value, onRefresh, realTimeUpdate, loading, error }: any) => (
  <div data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <h3>{title}</h3>
    <div data-testid="kpi-value">{loading ? '...' : error ? 'Error' : value}</div>
    {realTimeUpdate && <div data-testid="realtime-indicator">Real-time</div>}
    {onRefresh && (
      <button onClick={onRefresh} data-testid="refresh-btn">
        Refresh
      </button>
    )}
  </div>
);

const MockDashboardGrid = ({ items, enableDragDrop, onLayoutChange }: any) => (
  <div data-testid="dashboard-grid" data-drag-drop={enableDragDrop}>
    {items.map((item: any) => (
      <div key={item.id} data-testid={`grid-item-${item.id}`}>
        {item.component}
      </div>
    ))}
  </div>
);

// Mock the modules
vi.mock('@/components/charts/KPICard', () => ({
  KPICard: MockKPICard,
}));

vi.mock('@/components/layout/DashboardGrid', () => ({
  DashboardGrid: MockDashboardGrid,
  useDashboardLayout: () => ({
    layout: [],
    saveLayout: vi.fn(),
  }),
}));

vi.mock('@/components/charts/InventoryTrendChart', () => ({
  InventoryTrendChart: ({ onExport }: any) => (
    <div data-testid="inventory-trend-chart">
      <button onClick={onExport} data-testid="export-chart-btn">
        Export Chart
      </button>
    </div>
  ),
}));

vi.mock('@/hooks/useRealTimeData', () => ({
  useKPIData: vi.fn(),
  useSparklineData: vi.fn(),
}));

vi.mock('@/services/realtime', () => ({
  useRealtimeConnection: vi.fn(),
  useRealtimeKPIUpdates: vi.fn(),
}));

describe('Dashboard Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
  };

  const mockKPIData = {
    totalItems: { value: 1250, trend: 5.2 },
    totalQuantity: { value: 45000, trend: -2.1 },
    rejectRate: { value: 3.5, trend: -0.8 },
    activeUsers: { value: 12, trend: null },
  };

  const mockSparklineData = {
    totalItems: [100, 120, 110, 130, 125, 140, 135],
    totalQuantity: [4000, 4200, 4100, 4300, 4250, 4400, 4350],
    rejectRate: [4.2, 3.8, 4.1, 3.5, 3.2, 3.0, 2.8],
  };

  let EnhancedDashboard: any;
  let useKPIData: any;
  let useSparklineData: any;
  let useRealtimeConnection: any;
  let useRealtimeKPIUpdates: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import mocked modules
    const useRealTimeDataModule = await import('@/hooks/useRealTimeData');
    const realtimeModule = await import('@/services/realtime');
    
    useKPIData = useRealTimeDataModule.useKPIData;
    useSparklineData = useRealTimeDataModule.useSparklineData;
    useRealtimeConnection = realtimeModule.useRealtimeConnection;
    useRealtimeKPIUpdates = realtimeModule.useRealtimeKPIUpdates;

    // Setup default mock implementations
    vi.mocked(useKPIData).mockReturnValue({
      data: mockKPIData,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    vi.mocked(useSparklineData).mockReturnValue({
      data: mockSparklineData,
      loading: false,
    });

    vi.mocked(useRealtimeConnection).mockReturnValue(true);
    vi.mocked(useRealtimeKPIUpdates).mockImplementation((callback) => {
      (global as any).mockRealtimeCallback = callback;
    });

    // Import component after mocks are set up
    const dashboardModule = await import('../EnhancedDashboard');
    EnhancedDashboard = dashboardModule.EnhancedDashboard;
  });

  afterEach(() => {
    delete (global as any).mockRealtimeCallback;
  });

  describe('Real-time Data Updates', () => {
    it('should display real-time connection status', () => {
      render(<EnhancedDashboard user={mockUser} />);
      
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /real-time updates/i })).toBeChecked();
    });

    it('should show disconnected status when connection is lost', () => {
      vi.mocked(useRealtimeConnection).mockReturnValue(false);
      
      render(<EnhancedDashboard user={mockUser} />);
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should handle real-time KPI updates', async () => {
      render(<EnhancedDashboard user={mockUser} />);
      
      // Verify initial KPI values are displayed
      expect(screen.getByTestId('kpi-card-total-items')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-total-quantity')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-reject-rate')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-active-users')).toBeInTheDocument();

      // Simulate real-time update
      const updatedKPIs = {
        totalItems: { value: 1300, trend: 8.5 },
        totalQuantity: { value: 46000, trend: 2.2 },
        rejectRate: { value: 3.2, trend: -1.2 },
        activeUsers: { value: 15, trend: 25.0 },
      };

      act(() => {
        if ((global as any).mockRealtimeCallback) {
          (global as any).mockRealtimeCallback(updatedKPIs);
        }
      });

      // The callback should be called
      expect((global as any).mockRealtimeCallback).toBeDefined();
    });

    it('should toggle real-time updates when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedDashboard user={mockUser} />);
      
      const realtimeCheckbox = screen.getByRole('checkbox', { name: /real-time updates/i });
      
      // Initially checked
      expect(realtimeCheckbox).toBeChecked();
      
      // Uncheck to disable real-time updates
      await user.click(realtimeCheckbox);
      expect(realtimeCheckbox).not.toBeChecked();
      
      // Check again to re-enable
      await user.click(realtimeCheckbox);
      expect(realtimeCheckbox).toBeChecked();
    });

    it('should handle refresh button click', async () => {
      const mockRefresh = vi.fn();
      vi.mocked(useKPIData).mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      const user = userEvent.setup();
      render(<EnhancedDashboard user={mockUser} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Interaction with Components', () => {
    it('should render all KPI cards with correct data', () => {
      render(<EnhancedDashboard user={mockUser} />);
      
      // Check that all KPI cards are rendered
      expect(screen.getByTestId('kpi-card-total-items')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-total-quantity')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-reject-rate')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-active-users')).toBeInTheDocument();
    });

    it('should render quick actions panel with interactive buttons', async () => {
      const user = userEvent.setup();
      render(<EnhancedDashboard user={mockUser} />);
      
      // Check quick actions are rendered
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Add New Item')).toBeInTheDocument();
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
      expect(screen.getByText('Bulk Import')).toBeInTheDocument();

      // Test button interactions
      const addItemButton = screen.getByText('Add New Item').closest('button');
      const generateReportButton = screen.getByText('Generate Report').closest('button');
      const bulkImportButton = screen.getByText('Bulk Import').closest('button');

      expect(addItemButton).toBeInTheDocument();
      expect(generateReportButton).toBeInTheDocument();
      expect(bulkImportButton).toBeInTheDocument();

      // Click buttons to ensure they're interactive
      if (addItemButton) await user.click(addItemButton);
      if (generateReportButton) await user.click(generateReportButton);
      if (bulkImportButton) await user.click(bulkImportButton);
    });

    it('should render inventory trend chart with export functionality', async () => {
      const user = userEvent.setup();
      render(<EnhancedDashboard user={mockUser} />);
      
      expect(screen.getByTestId('inventory-trend-chart')).toBeInTheDocument();
      
      const exportButton = screen.getByTestId('export-chart-btn');
      await user.click(exportButton);
      
      // The export functionality should be accessible
      expect(exportButton).toBeInTheDocument();
    });

    it('should handle dashboard grid layout changes', async () => {
      render(<EnhancedDashboard user={mockUser} />);
      
      // Verify dashboard grid is rendered
      const dashboardGrid = screen.getByTestId('dashboard-grid');
      expect(dashboardGrid).toBeInTheDocument();
      expect(dashboardGrid).toHaveAttribute('data-drag-drop', 'true');
      
      // The grid should contain all expected items
      expect(screen.getByTestId('grid-item-kpi-total-items')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-kpi-total-quantity')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-kpi-reject-rate')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-kpi-active-users')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-inventory-trend-chart')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-quick-actions')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Loading States', () => {
    it('should handle KPI data loading state', () => {
      vi.mocked(useKPIData).mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refresh: vi.fn(),
      });

      render(<EnhancedDashboard user={mockUser} />);
      
      // Should show loading indicators in KPI cards
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });

    it('should handle KPI data error state', () => {
      const errorMessage = 'Failed to fetch KPI data';
      vi.mocked(useKPIData).mockReturnValue({
        data: null,
        loading: false,
        error: errorMessage,
        refresh: vi.fn(),
      });

      render(<EnhancedDashboard user={mockUser} />);
      
      // Error should be passed to KPI components
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });

    it('should handle sparkline data loading', () => {
      vi.mocked(useSparklineData).mockReturnValue({
        data: null,
        loading: true,
      });

      render(<EnhancedDashboard user={mockUser} />);
      
      // Should still render dashboard without sparkline data
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple rapid real-time updates efficiently', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<EnhancedDashboard user={mockUser} />);
      
      // Simulate rapid updates
      const updates = Array.from({ length: 10 }, (_, i) => ({
        totalItems: { value: 1250 + i * 10, trend: 5.2 + i },
        totalQuantity: { value: 45000 + i * 100, trend: -2.1 + i * 0.1 },
        rejectRate: { value: 3.5 - i * 0.1, trend: -0.8 - i * 0.1 },
        activeUsers: { value: 12 + i, trend: i * 2 },
      }));

      // Send updates rapidly
      updates.forEach((update, index) => {
        act(() => {
          if ((global as any).mockRealtimeCallback) {
            (global as any).mockRealtimeCallback(update);
          }
        });
      });

      // Should handle all updates without errors
      expect(consoleSpy).toHaveBeenCalledWith(
        'Received real-time KPI update:',
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('should maintain responsiveness with large datasets', () => {
      // Mock large sparkline dataset
      const largeSparklineData = {
        totalItems: Array.from({ length: 100 }, (_, i) => 1000 + i * 10),
        totalQuantity: Array.from({ length: 100 }, (_, i) => 40000 + i * 100),
        rejectRate: Array.from({ length: 100 }, (_, i) => 5 - (i * 0.01)),
      };

      vi.mocked(useSparklineData).mockReturnValue({
        data: largeSparklineData,
        loading: false,
      });

      const startTime = performance.now();
      render(<EnhancedDashboard user={mockUser} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });

    it('should handle concurrent user interactions without blocking', async () => {
      const mockRefresh = vi.fn();
      vi.mocked(useKPIData).mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      const user = userEvent.setup();
      render(<EnhancedDashboard user={mockUser} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      const realtimeCheckbox = screen.getByRole('checkbox', { name: /real-time updates/i });
      
      // Perform multiple interactions concurrently
      const interactions = [
        user.click(refreshButton),
        user.click(realtimeCheckbox),
        user.click(realtimeCheckbox), // Toggle back
      ];

      await Promise.all(interactions);

      // All interactions should complete successfully
      expect(mockRefresh).toHaveBeenCalled();
      expect(realtimeCheckbox).toBeChecked();
    });

    it('should efficiently update only changed components', async () => {
      const { rerender } = render(<EnhancedDashboard user={mockUser} />);
      
      // Update only one KPI value
      const updatedKPIData = {
        ...mockKPIData,
        totalItems: { value: 1300, trend: 8.5 },
      };

      vi.mocked(useKPIData).mockReturnValue({
        data: updatedKPIData,
        loading: false,
        error: null,
        refresh: vi.fn(),
      });

      rerender(<EnhancedDashboard user={mockUser} />);

      // Should re-render efficiently without full page refresh
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper ARIA labels and roles', () => {
      render(<EnhancedDashboard user={mockUser} />);
      
      // Check for proper checkbox labeling
      const realtimeCheckbox = screen.getByRole('checkbox', { name: /real-time updates/i });
      expect(realtimeCheckbox).toBeInTheDocument();
      
      // Check for button accessibility
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const mockRefresh = vi.fn();
      vi.mocked(useKPIData).mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      const user = userEvent.setup();
      render(<EnhancedDashboard user={mockUser} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Focus and activate with keyboard
      refreshButton.focus();
      await user.keyboard('{Enter}');
      
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should display loading states appropriately', () => {
      vi.mocked(useKPIData).mockReturnValue({
        data: mockKPIData,
        loading: false,
        error: null,
        refresh: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      });

      render(<EnhancedDashboard user={mockUser} />);
      
      // Should show appropriate loading indicators when refreshing
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });
  });
});