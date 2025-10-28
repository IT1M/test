import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardGrid, useDashboardLayout, type GridItem, type GridLayout } from '../DashboardGrid';

// Mock fetch for API calls
global.fetch = vi.fn();

const mockGridItems: GridItem[] = [
  {
    id: 'item-1',
    component: <div data-testid="component-1">Component 1</div>,
    size: 'sm',
    order: 0,
  },
  {
    id: 'item-2',
    component: <div data-testid="component-2">Component 2</div>,
    size: 'md',
    order: 1,
  },
  {
    id: 'item-3',
    component: <div data-testid="component-3">Component 3</div>,
    size: 'lg',
    order: 2,
  },
  {
    id: 'item-4',
    component: <div data-testid="component-4">Component 4</div>,
    size: 'xl',
    order: 3,
  },
];

describe('DashboardGrid Integration Tests', () => {
  const mockOnLayoutChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('Basic Rendering and Layout', () => {
    it('should render all grid items in correct order', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      // All components should be rendered
      expect(screen.getByTestId('component-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-2')).toBeInTheDocument();
      expect(screen.getByTestId('component-3')).toBeInTheDocument();
      expect(screen.getByTestId('component-4')).toBeInTheDocument();
    });

    it('should apply correct size classes to grid items', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const item1 = screen.getByTestId('component-1').closest('div');
      const item2 = screen.getByTestId('component-2').closest('div');
      const item3 = screen.getByTestId('component-3').closest('div');
      const item4 = screen.getByTestId('component-4').closest('div');

      expect(item1).toHaveClass('col-span-1');
      expect(item2).toHaveClass('col-span-1', 'md:col-span-2');
      expect(item3).toHaveClass('col-span-1', 'md:col-span-2', 'lg:col-span-3');
      expect(item4).toHaveClass('col-span-1', 'md:col-span-2', 'lg:col-span-4');
    });

    it('should use saved layout when provided', () => {
      const savedLayout: GridLayout[] = [
        { id: 'item-1', order: 3, size: 'lg' },
        { id: 'item-2', order: 2, size: 'sm' },
        { id: 'item-3', order: 1, size: 'md' },
        { id: 'item-4', order: 0, size: 'xl' },
      ];

      render(
        <DashboardGrid
          items={mockGridItems}
          savedLayout={savedLayout}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      // Items should be reordered according to saved layout
      const gridContainer = screen.getByTestId('component-1').closest('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should enable drag and drop when specified', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const item1 = screen.getByTestId('component-1').closest('div');
      expect(item1).toHaveAttribute('draggable', 'true');
      expect(item1).toHaveClass('cursor-move');
    });

    it('should not enable drag and drop by default', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const item1 = screen.getByTestId('component-1').closest('div');
      expect(item1).toHaveAttribute('draggable', 'false');
      expect(item1).not.toHaveClass('cursor-move');
    });

    it('should handle drag start event', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const item1 = screen.getByTestId('component-1').closest('div');
      
      // Create a mock drag event
      const dragEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
      });
      
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: {
          effectAllowed: '',
          setData: vi.fn(),
          getData: vi.fn(),
        },
        writable: false,
      });

      fireEvent(item1!, dragEvent);

      // Should apply dragging styles
      expect(item1).toHaveClass('opacity-50', 'scale-95');
    });

    it('should handle drag over event', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const item1 = screen.getByTestId('component-1').closest('div');
      const item2 = screen.getByTestId('component-2').closest('div');

      // Start dragging item1
      fireEvent.dragStart(item1!);

      // Drag over item2
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
      });
      fireEvent(item2!, dragOverEvent);

      // Should apply drag over styles
      expect(item2).toHaveClass('ring-2', 'ring-primary-500', 'ring-opacity-50');
    });

    it('should handle drop event and update layout', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const item1 = screen.getByTestId('component-1').closest('div');
      const item2 = screen.getByTestId('component-2').closest('div');

      // Start dragging item1
      fireEvent.dragStart(item1!);

      // Drop on item2
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
      });
      fireEvent(item2!, dropEvent);

      // Should call onLayoutChange with updated layout
      expect(mockOnLayoutChange).toHaveBeenCalled();
    });

    it('should clean up drag state on drag end', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const item1 = screen.getByTestId('component-1').closest('div');

      // Start dragging
      fireEvent.dragStart(item1!);
      expect(item1).toHaveClass('opacity-50', 'scale-95');

      // End dragging
      fireEvent.dragEnd(item1!);
      expect(item1).not.toHaveClass('opacity-50', 'scale-95');
    });
  });

  describe('Size Control Functionality', () => {
    it('should show size controls when drag and drop is enabled', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      // Size controls should be present (though hidden by default)
      const sizeSelects = screen.getAllByDisplayValue('S');
      expect(sizeSelects.length).toBeGreaterThan(0);
    });

    it('should handle size changes', async () => {
      const user = userEvent.setup();
      
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      // Find the size selector for the first item (small size)
      const sizeSelect = screen.getAllByDisplayValue('S')[0];
      
      // Change size to medium
      await user.selectOptions(sizeSelect, 'M');

      // Should call onLayoutChange with updated size
      expect(mockOnLayoutChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'item-1',
            size: 'md',
          }),
        ])
      );
    });

    it('should not show size controls when drag and drop is disabled', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={false}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      // Size controls should not be present
      const sizeSelects = screen.queryAllByDisplayValue('S');
      expect(sizeSelects).toHaveLength(0);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large numbers of grid items efficiently', () => {
      const largeItemSet: GridItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        component: <div data-testid={`component-${i}`}>Component {i}</div>,
        size: 'sm' as const,
        order: i,
      }));

      const startTime = performance.now();
      render(
        <DashboardGrid
          items={largeItemSet}
          onLayoutChange={mockOnLayoutChange}
        />
      );
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100);

      // All items should be rendered
      expect(screen.getByTestId('component-0')).toBeInTheDocument();
      expect(screen.getByTestId('component-49')).toBeInTheDocument();
    });

    it('should efficiently update when items change', () => {
      const { rerender } = render(
        <DashboardGrid
          items={mockGridItems}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      // Add a new item
      const updatedItems = [
        ...mockGridItems,
        {
          id: 'item-5',
          component: <div data-testid="component-5">Component 5</div>,
          size: 'sm' as const,
          order: 4,
        },
      ];

      rerender(
        <DashboardGrid
          items={updatedItems}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      // New item should be rendered
      expect(screen.getByTestId('component-5')).toBeInTheDocument();
      // Existing items should still be there
      expect(screen.getByTestId('component-1')).toBeInTheDocument();
    });

    it('should handle rapid layout changes without performance issues', async () => {
      const user = userEvent.setup();
      
      render(
        <DashboardGrid
          items={mockGridItems}
          enableDragDrop={true}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const sizeSelects = screen.getAllByRole('combobox');

      // Rapidly change sizes
      for (let i = 0; i < sizeSelects.length; i++) {
        await user.selectOptions(sizeSelects[i], 'L');
        await user.selectOptions(sizeSelects[i], 'M');
        await user.selectOptions(sizeSelects[i], 'S');
      }

      // Should handle all changes without errors
      expect(mockOnLayoutChange).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive grid classes', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-4'
      );
    });

    it('should handle custom className', () => {
      render(
        <DashboardGrid
          items={mockGridItems}
          className="custom-grid-class"
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass('custom-grid-class');
    });
  });
});

describe('useDashboardLayout Hook Integration Tests', () => {
  const TestComponent = ({ userId, dashboardId }: { userId: string; dashboardId?: string }) => {
    const { layout, loading, saveLayout } = useDashboardLayout(userId, dashboardId);
    
    return (
      <div>
        <div data-testid="loading">{loading ? 'Loading' : 'Loaded'}</div>
        <div data-testid="layout-count">{layout.length}</div>
        <button
          onClick={() => saveLayout([{ id: 'test', order: 0, size: 'sm' }])}
          data-testid="save-layout"
        >
          Save Layout
        </button>
      </div>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('should load saved layout from API', async () => {
    const mockResponse = {
      data: {
        dashboardLayout: {
          default: [
            { id: 'item-1', order: 0, size: 'sm' },
            { id: 'item-2', order: 1, size: 'md' },
          ],
        },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<TestComponent userId="user-123" />);

    // Should start loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      expect(screen.getByTestId('layout-count')).toHaveTextContent('2');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123/preferences');
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<TestComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      expect(screen.getByTestId('layout-count')).toHaveTextContent('0');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load dashboard layout:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should save layout to API', async () => {
    const user = userEvent.setup();
    
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    render(<TestComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    const saveButton = screen.getByTestId('save-layout');
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/user-123/preferences',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dashboardLayout: {
              default: [{ id: 'test', order: 0, size: 'sm' }],
            },
          }),
        })
      );
    });
  });

  it('should handle custom dashboard IDs', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: {
          dashboardLayout: {
            'custom-dashboard': [
              { id: 'item-1', order: 0, size: 'lg' },
            ],
          },
        },
      }),
    });

    render(<TestComponent userId="user-123" dashboardId="custom-dashboard" />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      expect(screen.getByTestId('layout-count')).toHaveTextContent('1');
    });
  });

  it('should handle save errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      })
      .mockRejectedValueOnce(new Error('Save failed'));

    render(<TestComponent userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    const saveButton = screen.getByTestId('save-layout');
    await user.click(saveButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save dashboard layout:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});