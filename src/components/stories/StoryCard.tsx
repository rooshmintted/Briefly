/**
 * Story Card Component
 * Displays an individual story in the feed with actions and metadata
 */

import React from 'react'
import { 
  BookmarkIcon as BookmarkOutline,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { 
  BookmarkIcon as BookmarkSolid 
} from '@heroicons/react/24/solid'
import { Story } from '@/types'
import { useAppStore } from '@/stores/appStore'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'

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

  const getImportanceStars = (score: number) => {
    const stars = Math.min(3, Math.max(0, Math.floor(score / 3)))
    return Array.from({ length: 3 }, (_, i) => (
      <StarIcon 
        key={i}
        className={clsx(
          'w-3 h-3',
          i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
        )}
      />
    ))
  }

  const timeAgo = formatDistanceToNow(new Date(story.created_at), { addSuffix: true })

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
          {story.estimated_read_time && (
            <>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-3 h-3" />
                <span>{story.estimated_read_time} min</span>
              </div>
            </>
          )}
        </div>
        
        {/* Importance stars */}
        <div className="flex items-center space-x-1">
          {getImportanceStars(story.importance_score || 0)}
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

      {/* Summary */}
      {story.summary && (
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-3 line-clamp-3">
          {story.summary}
        </p>
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