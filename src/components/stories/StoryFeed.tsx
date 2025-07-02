/**
 * Story Feed Component
 * Displays a list of stories with filtering, sorting, and infinite scroll
 */

import React, { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { StoryFeedProps } from '@/types'
import { HighlightsFeed } from '@/components/highlights/HighlightsFeed'
import { StoryCard } from '@/components/stories/StoryCard'

/**
 * Main story feed component
 */
export function StoryFeed() {
  const { 
    filteredStories, 
    isLoading, 
    error, 
    hasMore,
    loadStories,
    activeSmartView,
    stories
  } = useAppStore()

  // Check if we should show highlights instead of stories
  const showHighlights = activeSmartView === 'highlights'

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
        <div className="flex flex-col items-center justify-center text-center">
          <div className="spinner mb-4 mx-auto"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading stories...
          </p>
        </div>
      </div>
    )
  }

  // If highlights view is active, render highlights instead of stories
  if (showHighlights) {
    return (
      <HighlightsFeed
        onHighlightSelect={(storyId: string, highlightId: string) => {
          // Navigate to the story and pass highlight ID for scrolling
          const { selectStory } = useAppStore.getState()
          selectStory(storyId, highlightId)
        }}
      />
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
            onClick={() => {
              // Clear any selected highlight when opening a regular story
              const { selectStory } = useAppStore.getState()
              selectStory(story.id)
            }}
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