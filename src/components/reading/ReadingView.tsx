/**
 * Reading View Component
 * Displays a story in full reading mode with reading controls and navigation
 */

import React, { useEffect, useState } from 'react'
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
import { ReadingViewProps, Story } from '@/types'
import { useAppStore } from '@/stores/appStore'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { processStoryContent } from '@/lib/htmlUtils'

/**
 * Full-screen reading view component
 */
export function ReadingView({ 
  storyId, 
  onMarkAsRead, 
  onBookmark, 
  onNavigate, 
  onClose 
}: ReadingViewProps) {
  const { stories, settings } = useAppStore()
  const [readingProgress, setReadingProgress] = useState(0)
  const [loadedStory, setLoadedStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Try to find story in current stories array first
  const story = stories.find(s => s.id === storyId) || loadedStory

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
          service = createSupabaseServiceInstance()
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

  const timeAgo = formatDistanceToNow(new Date(story.created_at), { addSuffix: true })

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
      
      console.log('[ReadingView] Raw html_content:', story.html_content)
      console.log('[ReadingView] Raw content:', story.content)
      
      const processedContent = processStoryContent(story)
      console.log('[ReadingView] Processed content:', processedContent)
      console.log('[ReadingView] Processed content length:', processedContent.length)
    }
  }, [story])

  const handleShareClick = async () => {
    if (story.url) {
      if (window.electronAPI) {
        // Open in external browser via Electron
        window.electronAPI.openExternal(story.url)
      } else {
        // Fallback for web
        window.open(story.url, '_blank')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50">
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
            {story.estimated_read_time && ` • ${story.estimated_read_time} min read`}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Navigation buttons */}
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
              </div>
              
              {story.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {story.category}
                </span>
              )}
            </div>
          </header>

          {/* Article Content */}
          <div 
            className="reading-content prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: processStoryContent(story) }}
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
    </div>
  )
} 