/**
 * HTML Utilities for parsing and cleaning story content
 * Handles extraction and enhancement of article content for optimal reading experience
 * Preserves important formatting while removing clutter
 */

/**
 * Elements that should be preserved for good reading experience
 */
const PRESERVE_ELEMENTS = [
  // Content structure
  'article', 'section', 'div', 'main',
  // Headers
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Text formatting
  'p', 'span', 'strong', 'b', 'em', 'i', 'u', 'mark', 'del', 'ins',
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Links and media
  'a', 'img', 'picture', 'source', 'figure', 'figcaption',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  // Quotes and code
  'blockquote', 'q', 'cite', 'code', 'pre', 'kbd', 'samp', 'var',
  // Line breaks and separators
  'br', 'hr',
  // Semantic elements
  'time', 'abbr', 'acronym', 'address', 'small', 'sub', 'sup'
]

/**
 * Elements that should be completely removed (including their content)
 */
const REMOVE_ELEMENTS = [
  'script', 'style', 'noscript', 'iframe', 'embed', 'object',
  'form', 'input', 'button', 'select', 'textarea', 'fieldset', 'legend',
  'nav', 'aside', 'footer', 'header[role="banner"]',
  '[role="navigation"]', '[role="complementary"]', '[role="banner"]',
  '.advertisement', '.ad', '.ads', '.sidebar', '.navigation', '.nav-menu',
  '.comments', '.comment-section', '.social-share', '.share-buttons',
  '.newsletter-signup', '.popup', '.modal', '.overlay'
]

/**
 * Attributes to preserve for styling and functionality
 */
const PRESERVE_ATTRIBUTES = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'loading', 'width', 'height', 'data-*',
  'role', 'aria-*', 'lang', 'dir'
]

/**
 * Processes and preserves line breaks and newlines in content
 * Converts plain text newlines to proper HTML structure
 */
function enhanceLineBreaks(htmlContent: string): string {
  if (!htmlContent) return ''

  try {
    // First, handle cases where content might be plain text with newlines
    // Check if content has minimal HTML structure
    const hasMinimalHtml = /<[^>]+>/g.test(htmlContent)
    
    if (!hasMinimalHtml || htmlContent.split('<').length < 5) {
      // Likely plain text or minimal HTML - convert newlines to br tags
      let processed = htmlContent
        // Convert double newlines to paragraph breaks
        .replace(/\n\s*\n/g, '</p><p>')
        // Convert single newlines to br tags
        .replace(/\n/g, '<br>')
      
      // Wrap in paragraph tags if not already wrapped
      if (!processed.startsWith('<p>')) {
        processed = '<p>' + processed + '</p>'
      }
      
      return processed
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // Enhance existing br tags
    const brTags = doc.querySelectorAll('br')
    brTags.forEach(br => {
      br.classList.add('story-line-break')
    })
    
    // Look for text nodes that might contain newlines
    const walker = document.createTreeWalker(
      doc.body || doc,
      NodeFilter.SHOW_TEXT,
      null
    )
    
    const textNodes = []
    let node = walker.nextNode()
    while (node) {
      if (node.textContent && node.textContent.includes('\n')) {
        textNodes.push(node)
      }
      node = walker.nextNode()
    }
    
    // Process text nodes with newlines
    textNodes.forEach(textNode => {
      const parent = textNode.parentNode
      if (!parent) return
      
      // Skip if inside pre or code blocks where whitespace should be preserved as-is
      if (parent && 'tagName' in parent && ['PRE', 'CODE'].includes((parent as Element).tagName.toUpperCase())) {
        return
      }
      
      const text = textNode.textContent || ''
      if (text.trim()) {
        // Split by newlines and create proper HTML structure
        const lines = text.split('\n')
        const fragment = doc.createDocumentFragment()
        
        lines.forEach((line, index) => {
          if (line.trim()) {
            fragment.appendChild(doc.createTextNode(line))
          }
          
          // Add br tag between lines (except for the last line)
          if (index < lines.length - 1) {
            const br = doc.createElement('br')
            br.classList.add('story-line-break')
            fragment.appendChild(br)
          }
        })
        
        parent.replaceChild(fragment, textNode)
      }
    })
    
    return doc.body?.innerHTML || htmlContent
  } catch (error) {
    console.warn('Error enhancing line breaks:', error)
    return htmlContent
  }
}

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
        
        // Create a figure wrapper for semantic structure
        const figure = doc.createElement('figure')
        figure.className = 'story-image-wrapper'
        figure.appendChild(img)
        
        // Add caption if link had meaningful text
        if (link.textContent && link.textContent !== href) {
          const caption = doc.createElement('figcaption')
          caption.textContent = link.textContent
          caption.className = 'story-image-caption'
          figure.appendChild(caption)
        }
        
        // Replace the link with the figure
        link.parentNode?.replaceChild(figure, link)
      }
    })
    
    return doc.body?.innerHTML || htmlContent
  } catch (error) {
    console.warn('Error converting image links:', error)
    return htmlContent
  }
}

/**
 * Enhances images with proper attributes and semantic structure
 */
function enhanceImages(htmlContent: string): string {
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
      
      // Wrap standalone images in a figure if not already wrapped
      const parent = img.parentElement
      if (parent && !['figure', 'picture'].includes(parent.tagName.toLowerCase())) {
        const figure = doc.createElement('figure')
        figure.className = 'story-image-wrapper'
        parent.insertBefore(figure, img)
        figure.appendChild(img)
      }
    })
    
    return doc.body?.innerHTML || htmlContent
  } catch (error) {
    console.warn('Error enhancing images:', error)
    return htmlContent
  }
}

/**
 * Converts markdown headers to HTML headers
 */
function convertMarkdownHeaders(htmlContent: string): string {
  if (!htmlContent) return ''

  try {
    // Handle markdown headers in both plain text and within HTML
    let processed = htmlContent
    
    // Regular expression to match markdown headers
    // Matches: # Header, ## Header, ### Header, etc.
    // Supports headers at start of line or after whitespace
    const headerRegex = /^(\s*)(#{1,6}\s+)(.+?)$/gm
    
    processed = processed.replace(headerRegex, (match, leadingWhitespace, hashes, headerText) => {
      const level = hashes.trim().length // Count the # characters
      const text = headerText.trim()
      
      // Create proper HTML header
      return `${leadingWhitespace}<h${level} class="story-h${level} story-header">${text}</h${level}>`
    })
    
    return processed
  } catch (error) {
    console.warn('Error converting markdown headers:', error)
    return htmlContent
  }
}

/**
 * Enhances text formatting and structure for better readability
 */
function enhanceTextFormatting(htmlContent: string): string {
  if (!htmlContent) return ''

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // Enhance headers - add proper hierarchy classes
    const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headers.forEach(header => {
      const level = header.tagName.toLowerCase()
      header.classList.add(`story-${level}`, 'story-header')
    })
    
    // Enhance paragraphs
    const paragraphs = doc.querySelectorAll('p')
    paragraphs.forEach(p => {
      p.classList.add('story-paragraph')
      
      // Only remove completely empty paragraphs, preserve ones with minimal content or line breaks
      if (!p.textContent?.trim() && !p.querySelector('br, img, *')) {
        p.remove()
      }
    })
    
    // Enhance lists
    const lists = doc.querySelectorAll('ul, ol')
    lists.forEach(list => {
      list.classList.add('story-list')
    })
    
    const listItems = doc.querySelectorAll('li')
    listItems.forEach(li => {
      li.classList.add('story-list-item')
    })
    
    // Enhance blockquotes
    const quotes = doc.querySelectorAll('blockquote')
    quotes.forEach(quote => {
      quote.classList.add('story-blockquote')
    })
    
    // Enhance code blocks
    const codeBlocks = doc.querySelectorAll('pre, code')
    codeBlocks.forEach(code => {
      code.classList.add(code.tagName.toLowerCase() === 'pre' ? 'story-code-block' : 'story-code-inline')
    })
    
    // Enhance emphasis
    const emphasis = doc.querySelectorAll('strong, b, em, i')
    emphasis.forEach(el => {
      const tag = el.tagName.toLowerCase()
      if (['strong', 'b'].includes(tag)) {
        el.classList.add('story-bold')
      } else if (['em', 'i'].includes(tag)) {
        el.classList.add('story-italic')
      }
    })
    
    // Enhance links
    const links = doc.querySelectorAll('a[href]')
    links.forEach(link => {
      link.classList.add('story-link')
      // Add target="_blank" for external links
      const href = link.getAttribute('href')
      if (href?.startsWith('http') && !link.getAttribute('target')) {
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
      }
    })
    
    return doc.body?.innerHTML || htmlContent
  } catch (error) {
    console.warn('Error enhancing text formatting:', error)
    return htmlContent
  }
}

/**
 * Intelligently extracts and cleans HTML content while preserving formatting
 * Focuses on readability and visual appeal
 */
export function cleanHtmlContent(htmlContent: string): string {
  if (!htmlContent) return ''

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // Try to find the main content area with priority order
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content-body',
      '.story-content',
      '#content',
      '.content',
      'body'
    ]
    
    let contentElement = null
    
    for (const selector of contentSelectors) {
      const elements = doc.querySelectorAll(selector)
      for (const element of elements) {
        // Choose the element with the most text content
        if (element.textContent?.trim() && 
            (!contentElement || element.textContent.length > (contentElement.textContent?.length || 0))) {
          contentElement = element
        }
      }
      if (contentElement) break
    }
    
    // Fallback to body if no content area found
    if (!contentElement) {
      contentElement = doc.body
    }
    
    if (!contentElement) {
      return htmlContent // Return original if parsing fails
    }
    
    // Create a clean copy
    const cleanedElement = contentElement.cloneNode(true) as Element
    
    // Remove unwanted elements
    REMOVE_ELEMENTS.forEach(selector => {
      const elements = cleanedElement.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    })
    
    // Clean up attributes while preserving important ones
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
        const tagName = element.tagName.toLowerCase()
        
        // Remove elements not in our preserve list (except if they have important content)
        if (!PRESERVE_ELEMENTS.includes(tagName)) {
          // If it has significant text content, convert to div
          if (element.textContent?.trim() && element.textContent.length > 10) {
            const div = document.createElement('div')
            div.innerHTML = element.innerHTML
            div.className = 'story-content'
            element.parentNode?.replaceChild(div, element)
            return
          } else {
            // Remove if no significant content
            element.remove()
            return
          }
        }
        
        // Clean attributes
        const attributesToRemove = []
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i]
          const shouldPreserve = PRESERVE_ATTRIBUTES.some(preserveAttr => {
            if (preserveAttr.endsWith('*')) {
              return attr.name.startsWith(preserveAttr.slice(0, -1))
            }
            return attr.name === preserveAttr
          })
          
          if (!shouldPreserve) {
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
 * Processes story content for optimal reading experience
 * Handles both regular content and full HTML documents with enhanced formatting
 */
export function processStoryContent(story: { html_content?: string; content: string }): string {
  const htmlContent = story.html_content || story.content
  
  console.log('[processStoryContent] Processing content for optimal reading experience')
  
  let processedContent = htmlContent
  
  // Clean full HTML documents
  if (isFullHtmlDocument(htmlContent)) {
    console.log('[processStoryContent] Cleaning full HTML document while preserving formatting')
    processedContent = cleanHtmlContent(htmlContent)
  }
  
  // Enhance line breaks and newlines FIRST
  processedContent = enhanceLineBreaks(processedContent)
  
  // Convert markdown headers to HTML headers
  processedContent = convertMarkdownHeaders(processedContent)
  
  // Convert image links to proper img tags
  processedContent = convertImageLinksToTags(processedContent)
  
  // Enhance images with proper attributes and structure
  processedContent = enhanceImages(processedContent)
  
  // Enhance text formatting for better readability
  processedContent = enhanceTextFormatting(processedContent)
  
  console.log('[processStoryContent] Content processing complete')
  return processedContent
} 