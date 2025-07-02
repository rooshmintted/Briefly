/**
 * Highlight Card Component
 * Displays a highlight with context from its linked story
 */

import React from 'react'
import { Highlight, Story } from '@/types'
import { formatTimeAgo } from '@/lib/dateUtils'
import { clsx } from 'clsx'

interface HighlightCardProps {
  highlight: Highlight
  story: Story | null
  onClick: () => void
}

/**
 * Card component for displaying a highlight with story context
 */
export function HighlightCard({ highlight, story, onClick }: HighlightCardProps) {
  const getHighlightColorClass = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'blue':
        return 'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'green':
        return 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'pink':
        return 'bg-pink-100 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800'
      case 'purple':
        return 'bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
      default:
        return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
    }
  }

  const getHighlightTextClass = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'text-yellow-800 dark:text-yellow-200'
      case 'blue':
        return 'text-blue-800 dark:text-blue-200'
      case 'green':
        return 'text-green-800 dark:text-green-200'
      case 'pink':
        return 'text-pink-800 dark:text-pink-200'
      case 'purple':
        return 'text-purple-800 dark:text-purple-200'
      default:
        return 'text-yellow-800 dark:text-yellow-200'
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Highlighted Text */}
      <div className={clsx(
        'rounded-md p-3 mb-3 border-l-4',
        getHighlightColorClass(highlight.color)
      )}>
        <p className={clsx(
          'text-sm font-medium leading-relaxed',
          getHighlightTextClass(highlight.color)
        )}>
          "{highlight.highlighted_text}"
        </p>
      </div>

      {/* Story Context */}
      {story && (
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text-primary-light dark:text-text-primary-dark line-clamp-2">
                {story.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {story.publication_name}
                </span>
                {story.sender_name && (
                  <>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">•</span>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {story.sender_name}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {story.importance_score && (
              <div className="flex items-center space-x-1 ml-3">
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  story.importance_score >= 8 ? 'bg-red-500' :
                  story.importance_score >= 6 ? 'bg-yellow-500' :
                  'bg-green-500'
                )} />
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {story.importance_score}/10
                </span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
            <div className="flex items-center space-x-3">
              <span>Highlighted {formatTimeAgo(highlight.created_at)}</span>
              {story.estimated_read_time && (
                <>
                  <span>•</span>
                  <span>{story.estimated_read_time} min read</span>
                </>
              )}
              {story.category && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    {story.category}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fallback when story is not available */}
      {!story && (
        <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <p>Story not available</p>
          <p className="text-xs mt-1">Highlighted {formatTimeAgo(highlight.created_at)}</p>
        </div>
      )}
    </div>
  )
} 