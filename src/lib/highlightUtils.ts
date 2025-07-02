/**
 * Highlight Utilities
 * Functions for text selection detection, offset calculation, and highlight rendering
 */

import { TextSelection, Highlight } from '@/types'

/**
 * Extract text selection from the DOM and calculate character offsets
 */
export function extractTextSelection(container: Element): TextSelection | null {
  const selection = window.getSelection()
  
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0)
  
  // Ensure selection is within the container
  if (!container.contains(range.commonAncestorContainer)) {
    return null
  }

  const selectedText = selection.toString().trim()
  if (!selectedText || selectedText.length < 3) {
    return null
  }

  // Calculate character offsets relative to the container
  const textContent = container.textContent || ''
  const beforeRange = document.createRange()
  beforeRange.setStart(container, 0)
  beforeRange.setEnd(range.startContainer, range.startOffset)
  const startOffset = beforeRange.toString().length

  const endOffset = startOffset + selectedText.length

  // Get context around the selection
  const contextLength = 50
  const contextBefore = textContent.slice(Math.max(0, startOffset - contextLength), startOffset)
  const contextAfter = textContent.slice(endOffset, Math.min(textContent.length, endOffset + contextLength))

  // Get bounding rectangle for popup positioning
  const boundingRect = range.getBoundingClientRect()

  return {
    text: selectedText,
    startOffset,
    endOffset,
    contextBefore,
    contextAfter,
    boundingRect
  }
}

/**
 * Apply highlights to HTML content
 */
export function applyHighlightsToContent(htmlContent: string, highlights: Highlight[]): string {
  if (!highlights.length) {
    return htmlContent
  }

  // Sort highlights by start offset (descending) to avoid offset shifts when inserting HTML
  const sortedHighlights = [...highlights].sort((a, b) => b.start_offset - a.start_offset)
  
  // Convert HTML to text content to calculate positions
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent
  const textContent = tempDiv.textContent || ''
  
  let processedContent = htmlContent
  
  // Apply each highlight
  for (const highlight of sortedHighlights) {
    try {
      // Find the highlight text in the HTML content
      const highlightedText = textContent.slice(highlight.start_offset, highlight.end_offset)
      
      if (highlightedText === highlight.highlighted_text) {
        // Create highlight markup
        const highlightClass = `bg-${highlight.color}-200 dark:bg-${highlight.color}-800/30 rounded px-0.5`
        const highlightHtml = `<mark class="${highlightClass}" data-highlight-id="${highlight.id}">${highlightedText}</mark>`
        
        // Apply the highlight by replacing the text content
        // This is a simplified approach - in production, you'd want more sophisticated DOM manipulation
        processedContent = replaceTextAtOffset(processedContent, highlight.start_offset, highlight.end_offset, highlightHtml)
      }
    } catch (error) {
      console.warn('Error applying highlight:', highlight.id, error)
    }
  }
  
  return processedContent
}

/**
 * Replace text content at specific character offsets with HTML
 * This is a simplified implementation - more robust solutions would use proper DOM manipulation
 */
function replaceTextAtOffset(htmlContent: string, startOffset: number, endOffset: number, replacement: string): string {
  // Create a temporary DOM element to work with
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent
  
  // This is a simplified approach - for production, you'd want to:
  // 1. Walk the DOM tree to find text nodes
  // 2. Calculate cumulative text offsets
  // 3. Split text nodes as needed
  // 4. Insert highlight markup
  
  // For now, we'll use a basic string replacement approach
  const textContent = tempDiv.textContent || ''
  const targetText = textContent.slice(startOffset, endOffset)
  
  // Find and replace the first occurrence of the target text
  const firstOccurrence = htmlContent.indexOf(targetText)
  if (firstOccurrence !== -1) {
    return htmlContent.slice(0, firstOccurrence) + replacement + htmlContent.slice(firstOccurrence + targetText.length)
  }
  
  return htmlContent
}

/**
 * Remove highlight markup from content
 */
export function removeHighlightFromContent(htmlContent: string, highlightId: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  // Find the highlight element
  const highlightElement = doc.querySelector(`[data-highlight-id="${highlightId}"]`)
  
  if (highlightElement) {
    // Replace with just the text content
    const textNode = doc.createTextNode(highlightElement.textContent || '')
    highlightElement.parentNode?.replaceChild(textNode, highlightElement)
  }
  
  return doc.body.innerHTML
}

/**
 * Scroll to a specific highlight in the reading view
 */
export function scrollToHighlight(highlightId: string, container?: Element): boolean {
  // Try to find the highlight element by data attribute
  const selector = `[data-highlight-id="${highlightId}"]`
  const highlightElement = container 
    ? container.querySelector(selector)
    : document.querySelector(selector)
  
  if (!highlightElement) {
    console.warn(`Highlight element not found: ${highlightId}`)
    return false
  }

  // Scroll the element into view with smooth animation
  highlightElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  })

  // Add a temporary visual emphasis
  highlightElement.classList.add('highlight-focus')
  
  // Remove the emphasis after animation
  setTimeout(() => {
    highlightElement.classList.remove('highlight-focus')
  }, 2000)

  return true
}

/**
 * Debounce function for text selection events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
} 