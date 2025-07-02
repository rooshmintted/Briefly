/**
 * Highlights Feed Component
 * Displays all highlights across stories with story context
 */

import React, { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { HighlightCard } from './HighlightCard'
import { Highlight } from '@/types'

interface HighlightsFeedProps {
  onHighlightSelect: (storyId: string, highlightId: string) => void
}

/**
 * Feed component for displaying all highlights
 */
export function HighlightsFeed({ onHighlightSelect }: HighlightsFeedProps) {
  const { 
    highlights, 
    stories, 
    loadAllHighlights,
    isLoading
  } = useAppStore()

  // Load all highlights on mount
  useEffect(() => {
    loadAllHighlights()
  }, [loadAllHighlights])

  // Flatten all highlights from all stories with story context
  const allHighlights: Array<{ highlight: Highlight; storyId: string }> = []
  
  Object.entries(highlights).forEach(([storyId, storyHighlights]) => {
    storyHighlights.forEach(highlight => {
      allHighlights.push({ highlight, storyId })
    })
  })

  // Sort highlights by creation date (most recent first)
  const sortedHighlights = allHighlights.sort((a, b) => 
    new Date(b.highlight.created_at).getTime() - new Date(a.highlight.created_at).getTime()
  )

  const handleHighlightClick = (storyId: string, highlightId: string) => {
    onHighlightSelect(storyId, highlightId)
  }

  if (isLoading && sortedHighlights.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading highlights...
          </p>
        </div>
      </div>
    )
  }

  if (sortedHighlights.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            No highlights yet
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            Start highlighting interesting parts of stories to see them here.
          </p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Select text while reading to create your first highlight.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            Your Highlights
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {sortedHighlights.length} highlight{sortedHighlights.length !== 1 ? 's' : ''} across your stories
          </p>
        </div>

        {/* Highlights List */}
        <div className="space-y-4">
          {sortedHighlights.map(({ highlight, storyId }) => {
            const story = stories.find(s => s.id === storyId) || null
            
            return (
              <HighlightCard
                key={highlight.id}
                highlight={highlight}
                story={story}
                onClick={() => handleHighlightClick(storyId, highlight.id)}
              />
            )
          })}
        </div>

        {/* Load More Indicator */}
        {isLoading && sortedHighlights.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="text-text-secondary-light dark:text-text-secondary-dark">
              Loading more highlights...
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 