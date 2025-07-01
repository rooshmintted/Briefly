/**
 * Story Feed Component
 * Displays a list of stories with filtering, sorting, and infinite scroll
 */

import React, { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { StoryFeedProps } from '@/types'
import { StoryCard } from './StoryCard'

/**
 * Main story feed component
 */
export function StoryFeed({ filters, sort, showUnreadOnly, onStorySelect }: StoryFeedProps) {
  const { 
    filteredStories, 
    isLoading, 
    error, 
    hasMore,
    loadStories,
    activeSmartView,
    stories
  } = useAppStore()

  console.log('[StoryFeed] Rendered with:', {
    filteredStoriesCount: filteredStories.length,
    totalStoriesCount: stories.length,
    isLoading,
    error,
    activeSmartView,
    filteredStories: filteredStories.map(s => ({ 
      id: s.id, 
      title: s.title, 
      importance_score: s.importance_score,
      created_at: s.created_at,
      is_read: s.is_read
    }))
  })

  // Load stories on mount
  useEffect(() => {
    console.log('[StoryFeed] Loading stories on mount')
    loadStories()
  }, [loadStories])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            Something went wrong
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            {error}
          </p>
          <button 
            onClick={loadStories}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isLoading && filteredStories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading stories...
          </p>
        </div>
      </div>
    )
  }

  if (filteredStories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            No stories found
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {filteredStories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onClick={() => onStorySelect(story.id)}
          />
        ))}

        {/* Load More Indicator */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="text-text-secondary-light dark:text-text-secondary-dark">
              Loading more stories...
            </div>
          </div>
        )}

        {!hasMore && filteredStories.length > 0 && (
          <div className="text-center py-8">
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              You've reached the end of your stories
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 