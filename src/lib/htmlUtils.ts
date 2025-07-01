/**
 * HTML Utilities for parsing and cleaning story content
 * Handles extraction of article content from full HTML documents
 */

/**
 * Converts image links to actual img tags for better display
 */
function convertImageLinksToTags(htmlContent: string): string {
  if (!htmlContent) return ''

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // Find all links that point to images
    const links = doc.querySelectorAll('a[href]')
    
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (!href) return
      
      // Check if the link points to an image
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i
      const isImageLink = imageExtensions.test(href)
      
      // Also check if the link text suggests it's an image
      const linkText = link.textContent?.toLowerCase() || ''
      const suggestsImage = linkText.includes('image') || 
                           linkText.includes('photo') || 
                           linkText.includes('picture') ||
                           linkText.includes('img') ||
                           linkText === href.split('/').pop()?.toLowerCase()
      
      if (isImageLink || (suggestsImage && href.startsWith('http'))) {
        // Create an img element
        const img = doc.createElement('img')
        img.src = href
        img.alt = link.textContent || 'Image'
        img.className = 'story-image'
        
        // Create a wrapper div for the image
        const wrapper = doc.createElement('div')
        wrapper.className = 'story-image-wrapper'
        wrapper.appendChild(img)
        
        // Replace the link with the image
        link.parentNode?.replaceChild(wrapper, link)
      }
    })
    
    return doc.body?.innerHTML || htmlContent
  } catch (error) {
    console.warn('Error converting image links:', error)
    return htmlContent
  }
}

/**
 * Processes embedded images and ensures they have proper attributes
 */
function processImages(htmlContent: string): string {
  if (!htmlContent) return ''

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // Find all existing img tags
    const images = doc.querySelectorAll('img')
    
    images.forEach(img => {
      // Add CSS class for styling
      img.classList.add('story-image')
      
      // Ensure alt attribute exists
      if (!img.getAttribute('alt')) {
        img.setAttribute('alt', 'Image')
      }
      
      // Add loading attribute for performance
      img.setAttribute('loading', 'lazy')
      
      // Wrap standalone images in a wrapper div if not already wrapped
      const parent = img.parentElement
      if (parent && parent.tagName.toLowerCase() !== 'div' && 
          !parent.classList.contains('story-image-wrapper')) {
        const wrapper = doc.createElement('div')
        wrapper.className = 'story-image-wrapper'
        parent.insertBefore(wrapper, img)
        wrapper.appendChild(img)
      }
    })
    
    return doc.body?.innerHTML || htmlContent
  } catch (error) {
    console.warn('Error processing images:', error)
    return htmlContent
  }
}

/**
 * Extracts and cleans HTML content for safe rendering
 * Removes document structure and keeps only the article content
 */
export function cleanHtmlContent(htmlContent: string): string {
  if (!htmlContent) return ''

  try {
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // Try to find the main content area
    // Look for common article content selectors
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.article-content',
      '.post-content',
      '.entry-content',
      '#content',
      'body'
    ]
    
    let contentElement = null
    
    for (const selector of contentSelectors) {
      contentElement = doc.querySelector(selector)
      if (contentElement && contentElement.textContent?.trim()) {
        break
      }
    }
    
    // If no specific content area found, use body
    if (!contentElement) {
      contentElement = doc.body
    }
    
    if (!contentElement) {
      return htmlContent // Return original if parsing fails
    }
    
    // Clean up the content
    const cleanedElement = contentElement.cloneNode(true) as Element
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ad',
      '.sidebar',
      '.navigation',
      '[role="navigation"]'
    ]
    
    unwantedSelectors.forEach(selector => {
      const elements = cleanedElement.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    })
    
    // Remove unwanted attributes but keep useful ones
    const allowedAttributes = ['href', 'src', 'alt', 'title', 'class', 'loading', 'width', 'height']
    const walker = document.createTreeWalker(
      cleanedElement,
      NodeFilter.SHOW_ELEMENT,
      null
    )
    
    const elements = []
    let node = walker.nextNode()
    while (node) {
      elements.push(node)
      node = walker.nextNode()
    }
    
    elements.forEach((node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const attributesToRemove = []
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i]
          if (!allowedAttributes.includes(attr.name)) {
            attributesToRemove.push(attr.name)
          }
        }
        attributesToRemove.forEach(attrName => {
          element.removeAttribute(attrName)
        })
      }
    })
    
    return cleanedElement.innerHTML
    
  } catch (error) {
    console.warn('Error parsing HTML content:', error)
    // Fallback: try to extract content between body tags
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      return bodyMatch[1]
    }
    
    // Last resort: return original content
    return htmlContent
  }
}

/**
 * Checks if content appears to be a full HTML document
 */
export function isFullHtmlDocument(content: string): boolean {
  return content.trim().toLowerCase().startsWith('<html') || 
         content.includes('<!DOCTYPE')
}

/**
 * Processes story content for safe rendering
 * Handles both regular content and full HTML documents
 */
export function processStoryContent(story: { html_content?: string; content: string }): string {
  const htmlContent = story.html_content || story.content
  
  console.log('[processStoryContent] Input:', {
    hasHtmlContent: !!story.html_content,
    hasContent: !!story.content,
    selectedContent: story.html_content ? 'html_content' : 'content',
    contentLength: htmlContent.length,
    isFullDocument: isFullHtmlDocument(htmlContent)
  })
  
  let processedContent = htmlContent
  
  if (isFullHtmlDocument(htmlContent)) {
    console.log('[processStoryContent] Processing as full HTML document')
    processedContent = cleanHtmlContent(htmlContent)
  }
  
  // Convert image links to actual img tags
  processedContent = convertImageLinksToTags(processedContent)
  
  // Process existing images to ensure proper attributes and styling
  processedContent = processImages(processedContent)
  
  console.log('[processStoryContent] Final processed content length:', processedContent.length)
  return processedContent
} 