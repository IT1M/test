/**
 * Utility functions for testing accessibility compliance
 */

import { screen, within } from '@testing-library/react'

/**
 * Check if element has proper ARIA attributes
 */
export const checkAriaAttributes = (element: HTMLElement, expectedAttributes: Record<string, string | boolean>) => {
  return Object.entries(expectedAttributes).every(([attr, expectedValue]) => {
    const actualValue = element.getAttribute(`aria-${attr}`)
    
    if (typeof expectedValue === 'boolean') {
      return expectedValue ? actualValue !== null : actualValue === null
    }
    
    return actualValue === expectedValue
  })
}

/**
 * Check if element has proper focus management
 */
export const checkFocusManagement = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  return {
    hasFocusableElements: focusableElements.length > 0,
    focusableCount: focusableElements.length,
    elements: Array.from(focusableElements),
  }
}

/**
 * Check color contrast (simplified check for testing)
 */
export const checkColorContrast = (element: HTMLElement) => {
  const styles = window.getComputedStyle(element)
  const color = styles.color
  const backgroundColor = styles.backgroundColor
  
  // This is a simplified check - in real testing you'd use a proper contrast checker
  return {
    color,
    backgroundColor,
    hasContrast: color !== backgroundColor && color !== 'transparent' && backgroundColor !== 'transparent'
  }
}

/**
 * Check if form has proper labeling
 */
export const checkFormLabeling = (form: HTMLElement) => {
  const inputs = form.querySelectorAll('input, select, textarea')
  const results = Array.from(inputs).map(input => {
    const id = input.getAttribute('id')
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledBy = input.getAttribute('aria-labelledby')
    
    let hasLabel = false
    let labelText = ''
    
    if (id) {
      const label = form.querySelector(`label[for="${id}"]`)
      if (label) {
        hasLabel = true
        labelText = label.textContent || ''
      }
    }
    
    if (ariaLabel) {
      hasLabel = true
      labelText = ariaLabel
    }
    
    if (ariaLabelledBy) {
      const labelElement = form.querySelector(`#${ariaLabelledBy}`)
      if (labelElement) {
        hasLabel = true
        labelText = labelElement.textContent || ''
      }
    }
    
    return {
      element: input,
      hasLabel,
      labelText,
      id,
      ariaLabel,
      ariaLabelledBy,
    }
  })
  
  return {
    totalInputs: inputs.length,
    labeledInputs: results.filter(r => r.hasLabel).length,
    unlabeledInputs: results.filter(r => !r.hasLabel),
    results,
  }
}

/**
 * Check if element has proper heading hierarchy
 */
export const checkHeadingHierarchy = (container: HTMLElement) => {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const hierarchy = Array.from(headings).map(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    return {
      element: heading,
      level,
      text: heading.textContent || '',
    }
  })
  
  // Check for proper hierarchy (no skipped levels)
  let isValidHierarchy = true
  let previousLevel = 0
  
  for (const heading of hierarchy) {
    // Allow h3 as first heading if no h1/h2 exists (common in components)
    if (previousLevel === 0 && heading.level <= 3) {
      previousLevel = heading.level
      continue
    }
    
    if (heading.level > previousLevel + 1) {
      isValidHierarchy = false
      break
    }
    previousLevel = heading.level
  }
  
  return {
    headings: hierarchy,
    isValidHierarchy,
    hasH1: hierarchy.some(h => h.level === 1),
  }
}

/**
 * Check if interactive elements have proper roles
 */
export const checkInteractiveRoles = (container: HTMLElement) => {
  const interactiveElements = container.querySelectorAll(
    'button, [role="button"], a, [role="link"], input, select, textarea'
  )
  
  return Array.from(interactiveElements).map(element => {
    const tagName = element.tagName.toLowerCase()
    const role = element.getAttribute('role')
    const type = element.getAttribute('type')
    
    let expectedRole = ''
    switch (tagName) {
      case 'button':
        expectedRole = 'button'
        break
      case 'a':
        expectedRole = 'link'
        break
      case 'input':
        expectedRole = type === 'button' || type === 'submit' ? 'button' : 'textbox'
        break
      default:
        expectedRole = role || ''
    }
    
    return {
      element,
      tagName,
      role,
      expectedRole,
      hasCorrectRole: !role || role === expectedRole,
    }
  })
}

/**
 * Check if element supports keyboard navigation
 */
export const checkKeyboardNavigation = (element: HTMLElement) => {
  const tabIndex = element.getAttribute('tabindex')
  const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(
    element.tagName.toLowerCase()
  )
  const hasRole = element.getAttribute('role')
  
  return {
    isKeyboardAccessible: isInteractive || tabIndex !== null || hasRole === 'button',
    tabIndex,
    isInteractive,
    hasRole,
  }
}

/**
 * Check if images have alt text
 */
export const checkImageAltText = (container: HTMLElement) => {
  const images = container.querySelectorAll('img')
  
  return Array.from(images).map(img => {
    const alt = img.getAttribute('alt')
    const ariaLabel = img.getAttribute('aria-label')
    const ariaLabelledBy = img.getAttribute('aria-labelledby')
    const role = img.getAttribute('role')
    
    const hasAltText = alt !== null || ariaLabel !== null || ariaLabelledBy !== null
    const isDecorative = role === 'presentation' || alt === ''
    
    return {
      element: img,
      alt,
      ariaLabel,
      ariaLabelledBy,
      role,
      hasAltText,
      isDecorative,
      needsAltText: !isDecorative && !hasAltText,
    }
  })
}

/**
 * Check if live regions are properly configured
 */
export const checkLiveRegions = (container: HTMLElement) => {
  const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
  
  return Array.from(liveRegions).map(region => {
    const ariaLive = region.getAttribute('aria-live')
    const role = region.getAttribute('role')
    const ariaAtomic = region.getAttribute('aria-atomic')
    
    return {
      element: region,
      ariaLive,
      role,
      ariaAtomic,
      isConfigured: ariaLive !== null || role === 'status' || role === 'alert',
    }
  })
}

/**
 * Run comprehensive accessibility check
 */
export const runAccessibilityCheck = (container: HTMLElement) => {
  return {
    formLabeling: checkFormLabeling(container),
    headingHierarchy: checkHeadingHierarchy(container),
    interactiveRoles: checkInteractiveRoles(container),
    imageAltText: checkImageAltText(container),
    liveRegions: checkLiveRegions(container),
    focusManagement: checkFocusManagement(container),
  }
}

/**
 * Assert accessibility compliance
 */
export const assertAccessibilityCompliance = (container: HTMLElement) => {
  const results = runAccessibilityCheck(container)
  
  // Check form labeling
  if (results.formLabeling.unlabeledInputs.length > 0) {
    throw new Error(
      `Found ${results.formLabeling.unlabeledInputs.length} unlabeled form inputs`
    )
  }
  
  // Check heading hierarchy
  if (!results.headingHierarchy.isValidHierarchy) {
    throw new Error('Invalid heading hierarchy detected')
  }
  
  // Check interactive roles
  const incorrectRoles = results.interactiveRoles.filter(r => !r.hasCorrectRole)
  if (incorrectRoles.length > 0) {
    throw new Error(`Found ${incorrectRoles.length} elements with incorrect roles`)
  }
  
  // Check image alt text
  const imagesNeedingAlt = results.imageAltText.filter(img => img.needsAltText)
  if (imagesNeedingAlt.length > 0) {
    throw new Error(`Found ${imagesNeedingAlt.length} images without alt text`)
  }
  
  return true
}