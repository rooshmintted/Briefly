/**
 * Reading View Component
 * Displays a story in full reading mode with reading controls and navigation
 * Enhanced with beautiful typography and formatting for optimal reading experience
 */

import React, { useEffect, useState, useRef } from 'react'
import { 
  XMarkIcon,
  BookmarkIcon as BookmarkOutline,
  ArrowLeftIcon,
  ArrowRightIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { 
  BookmarkIcon as BookmarkSolid 
} from '@heroicons/react/24/solid'
import { ReadingViewProps, Story, TextSelection } from '@/types'
import { useAppStore } from '@/stores/appStore'
import { clsx } from 'clsx'
import { formatTimeAgo } from '@/lib/dateUtils'
import { processStoryContent } from '@/lib/htmlUtils'
import { extractTextSelection, applyHighlightsToContent, debounce, scrollToHighlight } from '@/lib/highlightUtils'
import { HighlightPopup } from './HighlightPopup'
import { YouTubeEmbed } from './YouTubeEmbed'

/**
 * Full-screen reading view component with enhanced typography
 */
export function ReadingView({ 
  storyId, 
  highlightId,
  onMarkAsRead, 
  onBookmark, 
  onNavigate, 
  onClose 
}: ReadingViewProps) {
  const { stories, settings, highlights, loadStoryHighlights, createHighlight } = useAppStore()
  const [readingProgress, setReadingProgress] = useState(0)
  const [loadedStory, setLoadedStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRating, setCurrentRating] = useState<number>(0)
  const [isUpdatingRating, setIsUpdatingRating] = useState(false)
  const [pendingRating, setPendingRating] = useState<number | null>(null)
  
  // Highlights state
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null)
  const [showHighlightPopup, setShowHighlightPopup] = useState(false)
  const readingContentRef = useRef<HTMLDivElement>(null)
  
  // Try to find story in current stories array first
  const story = stories.find(s => s.id === storyId) || loadedStory

  // Initialize rating when story changes
  useEffect(() => {
    if (story) {
      setCurrentRating(story.rating || 0)
      setPendingRating(null) // Clear any pending rating when story changes
      setIsUpdatingRating(false) // Reset updating state
    }
  }, [story])

  // Load story directly from Supabase if not found in current stories
  useEffect(() => {
    async function loadStoryFromSupabase() {
      if (stories.find(s => s.id === storyId)) {
        // Story already available in current stories
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
        const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

        let service = supabaseService
        if (!service) {
          service = await createSupabaseServiceInstance()
        }

        if (!service) {
          setError('Supabase service not available')
          return
        }

        service.setUserId(userId)
        const result = await service.loadStory(storyId)

        if (result.error) {
          setError(result.error)
        } else {
          setLoadedStory(result.story)
        }
      } catch (err) {
        console.error('Error loading story:', err)
        setError('Failed to load story')
      } finally {
        setIsLoading(false)
      }
    }

    loadStoryFromSupabase()
  }, [storyId, stories])

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.reading-content-scroll')
      if (!scrollContainer) return

      const scrollTop = scrollContainer.scrollTop
      const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }

    const scrollContainer = document.querySelector('.reading-content-scroll')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Mark as read when progress reaches 80%
  useEffect(() => {
    if (readingProgress >= 80 && story && !story.is_read) {
      onMarkAsRead(storyId)
    }
  }, [readingProgress, story, storyId, onMarkAsRead])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft') {
        onNavigate('prev')
      } else if (event.key === 'ArrowRight') {
        onNavigate('next')
      } else if (event.key === 'b' || event.key === 'B') {
        onBookmark(storyId)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [storyId, onClose, onNavigate, onBookmark])

  if (!story) {
    return (
      <div className="reading-view flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            Story not found
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            The story you're looking for doesn't exist or has been removed.
          </p>
          <button onClick={onClose} className="btn-primary">
            Back to Feed
          </button>
        </div>
      </div>
    )
  }

  const timeAgo = story ? formatTimeAgo(story.created_at) : ''

  // Debug logging for HTML content
  React.useEffect(() => {
    if (story) {
      console.log('[ReadingView] Story data:', {
        id: story.id,
        title: story.title,
        hasHtmlContent: !!story.html_content,
        hasContent: !!story.content,
        htmlContentLength: story.html_content?.length || 0,
        contentLength: story.content?.length || 0
      })
      
      const processedContent = processStoryContent(story)
      console.log('[ReadingView] Enhanced content processed for optimal reading experience')
    }
  }, [story])

  const handleShareClick = async () => {
    if (story?.url) {
      if (window.electronAPI) {
        // Open in external browser via Electron
        window.electronAPI.openExternal(story.url)
      } else {
        // Fallback for web
        window.open(story.url, '_blank')
      }
    }
  }

  /**
   * Handle rating change locally (immediate UI update)
   */
  const handleRatingChange = (newRating: number) => {
    const validRating = Math.min(10, Math.max(0, Math.round(newRating * 10) / 10))
    setCurrentRating(validRating)
    setPendingRating(validRating)
  }

  /**
   * Debounced effect to save rating to Supabase after 1 second of inactivity
   */
  useEffect(() => {
    if (pendingRating === null) return

    const timeoutId = setTimeout(async () => {
      setIsUpdatingRating(true)
      
      try {
        const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
        const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

        let service = supabaseService
        if (!service) {
          service = await createSupabaseServiceInstance()
        }

        if (!service) {
          console.error('Supabase service not available')
          return
        }

        service.setUserId(userId)
        const result = await service.updateStoryRating(storyId, pendingRating)

        if (result.error) {
          console.error('Error updating story rating:', result.error)
          // Revert rating on error
          setCurrentRating(story?.rating || 0)
        } else {
          console.log('Story rating updated successfully:', pendingRating)
        }
      } catch (err) {
        console.error('Error updating story rating:', err)
        // Revert rating on error
        setCurrentRating(story?.rating || 0)
      } finally {
        setIsUpdatingRating(false)
        setPendingRating(null)
      }
    }, 1000) // 1 second debounce

    // Cleanup timeout if component unmounts or pendingRating changes
    return () => clearTimeout(timeoutId)
  }, [pendingRating, storyId, story?.rating])

  // Load highlights when story changes
  useEffect(() => {
    if (story && !highlights[storyId]) {
      loadStoryHighlights(storyId)
    }
  }, [story, storyId, highlights, loadStoryHighlights])

  // Scroll to specific highlight when highlights are loaded and highlightId is provided
  useEffect(() => {
    if (highlightId && highlights[storyId] && readingContentRef.current) {
      // Small delay to ensure the content is rendered with highlights
      const timer = setTimeout(() => {
        const success = scrollToHighlight(highlightId, readingContentRef.current!)
        if (success) {
          console.log(`Scrolled to highlight: ${highlightId}`)
        }
      }, 500) // 500ms delay to ensure DOM is updated

      return () => clearTimeout(timer)
    }
  }, [highlightId, highlights, storyId])

  // Text selection detection with debounce
  useEffect(() => {
    const contentElement = readingContentRef.current
    if (!contentElement) return

    const handleSelectionChange = debounce(() => {
      const selection = extractTextSelection(contentElement)
      
      if (selection) {
        setCurrentSelection(selection)
        setShowHighlightPopup(true)
      } else {
        setCurrentSelection(null)
        setShowHighlightPopup(false)
      }
    }, 200)

    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 10) // Small delay to ensure selection is complete
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      // Only trigger on selection keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift'].includes(event.key)) {
        setTimeout(handleSelectionChange, 10)
      }
    }

    contentElement.addEventListener('mouseup', handleMouseUp)
    contentElement.addEventListener('keyup', handleKeyUp)

    return () => {
      contentElement.removeEventListener('mouseup', handleMouseUp)
      contentElement.removeEventListener('keyup', handleKeyUp)
    }
  }, [story])

  // Handle highlight creation
  const handleCreateHighlight = async () => {
    if (!currentSelection || !story) return

    try {
      await createHighlight(storyId, {
        highlightedText: currentSelection.text,
        startOffset: currentSelection.startOffset,
        endOffset: currentSelection.endOffset,
        contextBefore: currentSelection.contextBefore,
        contextAfter: currentSelection.contextAfter,
        color: 'yellow'
      })

      // Clear selection and hide popup
      setCurrentSelection(null)
      setShowHighlightPopup(false)
      
      // Clear DOM selection
      window.getSelection()?.removeAllRanges()
    } catch (error) {
      console.error('Error creating highlight:', error)
    }
  }

  // Close highlight popup
  const handleCloseHighlightPopup = () => {
    setShowHighlightPopup(false)
    setCurrentSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50">
      {/* Enhanced CSS Styles for Beautiful Reading Experience */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Enhanced Typography Styles */
        .reading-content :global(.story-h1) {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 2rem 0 1.5rem 0;
          color: rgb(17 24 39);
        }
        
        .dark .reading-content :global(.story-h1) {
          color: rgb(249 250 251);
        }
        
        .reading-content :global(.story-h2) {
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 1.75rem 0 1.25rem 0;
          color: rgb(31 41 55);
        }
        
        .dark .reading-content :global(.story-h2) {
          color: rgb(243 244 246);
        }
        
        .reading-content :global(.story-h3) {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 1.5rem 0 1rem 0;
          color: rgb(55 65 81);
        }
        
        .dark .reading-content :global(.story-h3) {
          color: rgb(229 231 235);
        }
        
        .reading-content :global(.story-h4) {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 1.25rem 0 0.75rem 0;
          color: rgb(75 85 99);
        }
        
        .dark .reading-content :global(.story-h4) {
          color: rgb(209 213 219);
        }
        
        .reading-content :global(.story-h5) {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.5;
          margin: 1rem 0 0.5rem 0;
          color: rgb(107 114 128);
        }
        
        .dark .reading-content :global(.story-h5) {
          color: rgb(156 163 175);
        }
        
        .reading-content :global(.story-h6) {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.5;
          margin: 1rem 0 0.5rem 0;
          color: rgb(107 114 128);
        }
        
        .dark .reading-content :global(.story-h6) {
          color: rgb(156 163 175);
        }
        
        /* Enhanced Paragraph Styles */
        .reading-content :global(.story-paragraph) {
          margin: 1.25rem 0;
          line-height: 1.7;
          color: rgb(55 65 81);
        }
        
        .dark .reading-content :global(.story-paragraph) {
          color: rgb(209 213 219);
        }
        
        /* Enhanced Line Break Styles */
        .reading-content :global(.story-line-break) {
          display: block;
          margin: 0.5rem 0;
          height: 1.2em;
        }
        
        .reading-content :global(br) {
          display: block;
          margin: 0.5rem 0;
          height: 1.2em;
        }
        
        /* Enhanced Text Formatting */
        .reading-content :global(.story-bold) {
          font-weight: 600;
          color: rgb(17 24 39);
        }
        
        .dark .reading-content :global(.story-bold) {
          color: rgb(249 250 251);
        }
        
        .reading-content :global(.story-italic) {
          font-style: italic;
          color: rgb(75 85 99);
        }
        
        .dark .reading-content :global(.story-italic) {
          color: rgb(156 163 175);
        }
        
        /* Enhanced Link Styles */
        .reading-content :global(.story-link) {
          color: rgb(59 130 246);
          text-decoration: underline;
          text-decoration-color: rgba(59, 130, 246, 0.3);
          text-underline-offset: 2px;
          transition: all 0.2s ease;
        }
        
        .reading-content :global(.story-link:hover) {
          color: rgb(37 99 235);
          text-decoration-color: rgb(37 99 235);
        }
        
        .dark .reading-content :global(.story-link) {
          color: rgb(96 165 250);
        }
        
        .dark .reading-content :global(.story-link:hover) {
          color: rgb(147 197 253);
        }
        
        /* Enhanced List Styles */
        .reading-content :global(.story-list) {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }
        
        .reading-content :global(.story-list-item) {
          margin: 0.5rem 0;
          line-height: 1.6;
          color: rgb(55 65 81);
        }
        
        .dark .reading-content :global(.story-list-item) {
          color: rgb(209 213 219);
        }
        
        /* Enhanced Blockquote Styles */
        .reading-content :global(.story-blockquote) {
          border-left: 4px solid rgb(59 130 246);
          padding: 1rem 1.5rem;
          margin: 2rem 0;
          background: rgb(248 250 252);
          font-style: italic;
          color: rgb(75 85 99);
          border-radius: 0 0.5rem 0.5rem 0;
        }
        
        .dark .reading-content :global(.story-blockquote) {
          background: rgb(17 24 39);
          color: rgb(156 163 175);
          border-left-color: rgb(96 165 250);
        }
        
        /* Enhanced Code Styles */
        .reading-content :global(.story-code-inline) {
          background: rgb(243 244 246);
          color: rgb(220 38 127);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 0.875em;
        }
        
        .dark .reading-content :global(.story-code-inline) {
          background: rgb(55 65 81);
          color: rgb(251 146 60);
        }
        
        .reading-content :global(.story-code-block) {
          background: rgb(249 250 251);
          border: 1px solid rgb(229 231 235);
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .dark .reading-content :global(.story-code-block) {
          background: rgb(31 41 55);
          border-color: rgb(75 85 99);
          color: rgb(209 213 219);
        }
        
        /* Enhanced Image Styles */
        .reading-content :global(.story-image-wrapper) {
          margin: 2rem 0;
          text-align: center;
        }
        
        .reading-content :global(.story-image) {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .dark .reading-content :global(.story-image) {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        }
        
        .reading-content :global(.story-image-caption) {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: rgb(107 114 128);
          font-style: italic;
        }
        
        .dark .reading-content :global(.story-image-caption) {
          color: rgb(156 163 175);
        }
        
        /* Enhanced Content Container */
        .reading-content :global(.story-content) {
          margin: 1rem 0;
        }
        
        /* Smooth Reading Flow */
        .reading-content {
          hyphens: auto;
          word-wrap: break-word;
          white-space: pre-line;
        }
        
        /* Preserve whitespace in specific contexts */
        .reading-content :global(pre),
        .reading-content :global(.story-code-block) {
          white-space: pre-wrap;
        }
        
        /* Better paragraph spacing */
        .reading-content :global(p + p) {
          margin-top: 1.5rem;
        }
        
        .reading-content :global(p:empty) {
          margin: 1rem 0;
          height: 1em;
        }
        
        /* Enhanced Rating Slider Styles */
        .slider-smooth {
          transition: all 0.15s ease;
        }
        
        .slider-smooth::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(59 130 246);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .dark .slider-smooth::-webkit-slider-thumb {
          background: rgb(96 165 250);
          border-color: rgb(17 24 39);
        }
        
        .slider-smooth::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        
        .slider-smooth::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(59 130 246);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .dark .slider-smooth::-moz-range-thumb {
          background: rgb(96 165 250);
          border-color: rgb(17 24 39);
        }

        /* Enhanced Highlight Styles */
        .reading-content :global(mark[data-highlight-id]) {
          background: rgba(255, 235, 59, 0.3);
          border-radius: 2px;
          padding: 0 2px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .reading-content :global(mark[data-highlight-id]:hover) {
          background: rgba(255, 235, 59, 0.5);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .dark .reading-content :global(mark[data-highlight-id]) {
          background: rgba(255, 235, 59, 0.2);
          color: inherit;
        }
        
        .dark .reading-content :global(mark[data-highlight-id]:hover) {
          background: rgba(255, 235, 59, 0.3);
        }
        
        /* Blue highlights */
        .reading-content :global(mark.bg-blue-200) {
          background: rgba(59, 130, 246, 0.3);
        }
        
        .dark .reading-content :global(mark.bg-blue-800\\/30) {
          background: rgba(59, 130, 246, 0.2);
        }
        
        /* Green highlights */
        .reading-content :global(mark.bg-green-200) {
          background: rgba(34, 197, 94, 0.3);
        }
        
        .dark .reading-content :global(mark.bg-green-800\\/30) {
          background: rgba(34, 197, 94, 0.2);
        }
        
        /* Pink highlights */
        .reading-content :global(mark.bg-pink-200) {
          background: rgba(236, 72, 153, 0.3);
        }
        
        .dark .reading-content :global(mark.bg-pink-800\\/30) {
          background: rgba(236, 72, 153, 0.2);
        }
        
        /* Purple highlights */
        .reading-content :global(mark.bg-purple-200) {
          background: rgba(147, 51, 234, 0.3);
        }
        
        .dark .reading-content :global(mark.bg-purple-800\\/30) {
          background: rgba(147, 51, 234, 0.2);
        }
        
        /* Highlight focus animation for scrolling */
        .reading-content :global(mark.highlight-focus) {
          animation: highlightPulse 2s ease-in-out;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        
        .dark .reading-content :global(mark.highlight-focus) {
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
        }
        
        @keyframes highlightPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .reading-content :global(.story-h1) {
            font-size: 1.875rem;
          }
          
          .reading-content :global(.story-h2) {
            font-size: 1.5rem;
          }
          
          .reading-content :global(.story-h3) {
            font-size: 1.25rem;
          }
                 }
       `}} />

      {/* Reading Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-10">
        <div 
          className="h-full bg-accent-light dark:bg-accent-dark transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="btn-ghost p-1"
            aria-label="Close reading view"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {story.publication_name} • {timeAgo}
            {` • ${story.estimated_read_time || 6} min read`}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Navigation buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('prev')}
              className="btn-ghost p-1"
              aria-label="Previous story"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onNavigate('next')}
              className="btn-ghost p-1"
              aria-label="Next story"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Rating Slider */}
          <div className="flex items-center space-x-2 min-w-32">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Rating:
            </span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={currentRating}
              onChange={(e) => handleRatingChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-smooth"
              aria-label="Story rating"
            />
            <div className="flex items-center space-x-1 w-12">
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {currentRating.toFixed(1)}
              </span>
              {isUpdatingRating && (
                <div className="w-2 h-2 bg-accent-light dark:bg-accent-dark rounded-full animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Bookmark button */}
            <button
              onClick={() => onBookmark(storyId)}
              className="btn-ghost p-1"
              aria-label={story.is_bookmarked ? 'Remove bookmark' : 'Bookmark story'}
            >
              {story.is_bookmarked ? (
                <BookmarkSolid className="w-4 h-4 text-accent-light dark:text-accent-dark" />
              ) : (
                <BookmarkOutline className="w-4 h-4" />
              )}
            </button>

            {/* Share button */}
            {story.url && (
              <button
                onClick={handleShareClick}
                className="btn-ghost p-1"
                aria-label="Open original article"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reading Content */}
      <div className="reading-content-scroll absolute inset-0 overflow-y-auto pt-20 pb-8">
        <div className={clsx(
          'reading-content px-8 mx-auto',
          settings.reading.contentWidth === 'narrow' && 'max-w-2xl',
          settings.reading.contentWidth === 'medium' && 'max-w-3xl',
          settings.reading.contentWidth === 'wide' && 'max-w-4xl',
          settings.reading.fontSize === 'small' && 'text-sm',
          settings.reading.fontSize === 'medium' && 'text-base',
          settings.reading.fontSize === 'large' && 'text-lg',
          settings.reading.lineHeight === 'compact' && 'leading-tight',
          settings.reading.lineHeight === 'normal' && 'leading-normal',
          settings.reading.lineHeight === 'relaxed' && 'leading-relaxed'
        )}>
          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-headline font-display font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              {story.title}
            </h1>
            
            {story.summary && (
              <p className="text-body-large text-text-secondary-light dark:text-text-secondary-dark mb-6 italic">
                {story.summary}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark">
              <div className="flex items-center space-x-2">
                {story.sender_name && (
                  <>
                    <span>By {story.sender_name}</span>
                    <span>•</span>
                  </>
                )}
                <span>{story.publication_name}</span>
                <span>•</span>
                <span>{timeAgo}</span>
                {story.content_type === 'video' && story.video_duration && (
                  <>
                    <span>•</span>
                    <span>{story.video_duration} min video</span>
                  </>
                )}
              </div>
              
              {story.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {story.category}
                </span>
              )}
            </div>
          </header>

          {/* Video Content */}
          {story.content_type === 'video' && story.video_url && (
            <div className="mb-8">
              <YouTubeEmbed 
                videoUrl={story.video_url} 
                title={story.title}
                className="mb-6"
              />
              
              {/* Video metadata */}
              <div className="flex items-center justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                <div className="flex items-center space-x-4">
                  {story.video_duration && (
                    <span>Duration: {story.video_duration} minutes</span>
                  )}
                  <a 
                    href={story.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-light dark:text-accent-dark hover:underline"
                  >
                    Watch on YouTube
                  </a>
                </div>
              </div>
              
              {/* Separator */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                  Additional Content
                </h2>
              </div>
            </div>
          )}

          {/* Article Content with Enhanced Formatting */}
          <div 
            ref={readingContentRef}
            className="reading-content prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: applyHighlightsToContent(
                processStoryContent(story), 
                highlights[storyId] || []
              ) 
            }}
          />

          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Reading progress: {Math.round(readingProgress)}%
              </div>
              
              {story.url && (
                <button
                  onClick={handleShareClick}
                  className="btn-secondary text-sm"
                >
                  Read Original Article
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      {/* Highlight Popup */}
      <HighlightPopup
        selection={currentSelection}
        visible={showHighlightPopup}
        onHighlight={handleCreateHighlight}
        onClose={handleCloseHighlightPopup}
      />
    </div>
  )
} 