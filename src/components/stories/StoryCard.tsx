/**
 * Story Card Component
 * Displays an individual story in the feed with actions and metadata
 */

import React from 'react'
import { 
  BookmarkIcon as BookmarkOutline,
  ClockIcon
} from '@heroicons/react/24/outline'
import { 
  BookmarkIcon as BookmarkSolid 
} from '@heroicons/react/24/solid'
import { Story } from '@/types'
import { useAppStore } from '@/stores/appStore'
import { clsx } from 'clsx'
import { formatTimeAgo } from '@/lib/dateUtils'

interface StoryCardProps {
  story: Story
  onClick: () => void
}

/**
 * Individual story card component
 */
export function StoryCard({ story, onClick }: StoryCardProps) {
  const { markStoryAsRead, toggleStoryBookmark } = useAppStore()

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    
    // Mark as read when clicking to open
    if (!story.is_read) {
      markStoryAsRead(story.id, true)
    }
    
    onClick()
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleStoryBookmark(story.id)
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    markStoryAsRead(story.id, !story.is_read)
  }

  const getRatingDisplay = (rating?: number) => {
    if (!rating && rating !== 0) {
      return (
        <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1 rounded">
          No rating
        </span>
      )
    }

    // Color-coded rating system (0-10 scale)
    const getRatingColor = (rating: number) => {
      if (rating <= 3) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      if (rating <= 5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      if (rating <= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      if (rating <= 8.5) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    }

    const getRatingLabel = (rating: number) => {
      if (rating <= 3) return 'Poor'
      if (rating <= 5) return 'Fair'
      if (rating <= 7) return 'Good'
      if (rating <= 8.5) return 'Great'
      return 'Excellent'
    }

    return (
      <div className="flex items-center space-x-1">
        <span className={clsx(
          'text-xs font-medium px-2 py-1 rounded-full',
          getRatingColor(rating)
        )}>
          {rating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {getRatingLabel(rating)}
        </span>
      </div>
    )
  }

  const timeAgo = formatTimeAgo(story.created_at)

  return (
    <article 
      className={clsx(
        'story-card cursor-pointer transition-all duration-200',
        !story.is_read && 'border-l-4 border-l-accent-light dark:border-l-accent-dark'
      )}
      onClick={handleCardClick}
    >
      {/* Header with metadata */}
      <header className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <span className="font-medium">{story.publication_name}</span>
          <span>•</span>
          <span>{timeAgo}</span>
          <>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>
                {story.estimated_read_time || story.video_duration || 6} min{' '}
                {story.content_type === 'video' ? 'video' : 'read'}
              </span>
            </div>
          </>
        </div>
        
        {/* Rating display */}
        <div className="flex items-center">
          {getRatingDisplay(story.rating)}
        </div>
      </header>

      {/* Title */}
      <h2 className={clsx(
        'text-lg font-semibold mb-2 line-clamp-2',
        story.is_read 
          ? 'text-text-secondary-light dark:text-text-secondary-dark' 
          : 'text-text-primary-light dark:text-text-primary-dark'
      )}>
        {story.title}
      </h2>

      {/* Key Points */}
      {story.key_points && story.key_points.length > 0 && (
        <div className="mb-3">
          <ul className="space-y-1">
            {story.key_points.slice(0, 3).map((point, index) => (
              <li 
                key={index}
                className="text-text-secondary-light dark:text-text-secondary-dark text-sm flex items-start"
              >
                <span className="text-accent-light dark:text-accent-dark mr-2 flex-shrink-0 leading-5">•</span>
                <span className="break-words">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category tag */}
      {story.category && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {story.category}
          </span>
        </div>
      )}

      {/* Actions */}
      <footer className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Read status indicator */}
          {!story.is_read && (
            <div className="w-2 h-2 bg-accent-light dark:bg-accent-dark rounded-full"></div>
          )}
          
          {story.is_read && (
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Read
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {/* Mark as read/unread button */}
          <button
            onClick={handleMarkAsRead}
            className="btn-ghost text-xs px-2 py-1"
            aria-label={story.is_read ? 'Mark as unread' : 'Mark as read'}
          >
            {story.is_read ? 'Mark unread' : 'Mark read'}
          </button>

          {/* Bookmark button */}
          <button
            onClick={handleBookmarkClick}
            className="btn-ghost p-1"
            aria-label={story.is_bookmarked ? 'Remove bookmark' : 'Bookmark story'}
          >
            {story.is_bookmarked ? (
              <BookmarkSolid className="w-4 h-4 text-accent-light dark:text-accent-dark" />
            ) : (
              <BookmarkOutline className="w-4 h-4" />
            )}
          </button>
        </div>
      </footer>
    </article>
  )
} 