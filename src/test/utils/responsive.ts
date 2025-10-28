/**
 * Utility functions for testing responsive behavior
 */

export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Set viewport size for responsive testing
 */
export const setViewportSize = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

/**
 * Set viewport to specific breakpoint
 */
export const setBreakpoint = (breakpoint: Breakpoint) => {
  setViewportSize(BREAKPOINTS[breakpoint])
}

/**
 * Mock matchMedia for specific breakpoint
 */
export const mockMatchMedia = (breakpoint: Breakpoint) => {
  const width = BREAKPOINTS[breakpoint]
  
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    // Parse common media queries
    const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/)
    const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/)
    
    let matches = false
    
    if (minWidthMatch) {
      const minWidth = parseInt(minWidthMatch[1])
      matches = width >= minWidth
    } else if (maxWidthMatch) {
      const maxWidth = parseInt(maxWidthMatch[1])
      matches = width <= maxWidth
    }
    
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  })
}

/**
 * Test component at different breakpoints
 */
export const testAtBreakpoints = (
  renderFn: () => void,
  testFn: (breakpoint: Breakpoint) => void
) => {
  Object.keys(BREAKPOINTS).forEach((bp) => {
    const breakpoint = bp as Breakpoint
    
    describe(`at ${breakpoint} breakpoint`, () => {
      beforeEach(() => {
        setBreakpoint(breakpoint)
        mockMatchMedia(breakpoint)
      })
      
      testFn(breakpoint)
    })
  })
}

/**
 * Check if element has responsive classes
 */
export const hasResponsiveClasses = (element: HTMLElement, classes: Record<Breakpoint, string[]>) => {
  const classList = Array.from(element.classList)
  
  return Object.entries(classes).every(([breakpoint, expectedClasses]) => {
    return expectedClasses.every(cls => {
      // Handle Tailwind responsive prefixes
      const responsiveClass = breakpoint === 'mobile' ? cls : `${breakpoint}:${cls}`
      return classList.includes(responsiveClass) || classList.includes(cls)
    })
  })
}

/**
 * Get computed styles for responsive testing
 */
export const getResponsiveStyles = (element: HTMLElement) => {
  return window.getComputedStyle(element)
}

/**
 * Simulate touch device
 */
export const mockTouchDevice = () => {
  Object.defineProperty(window, 'ontouchstart', {
    value: () => {},
    writable: true,
  })
  
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: 5,
    writable: true,
  })
}

/**
 * Simulate desktop device
 */
export const mockDesktopDevice = () => {
  Object.defineProperty(window, 'ontouchstart', {
    value: undefined,
    writable: true,
    configurable: true,
  })
  
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: 0,
    writable: true,
    configurable: true,
  })
}