/**
 * Search View Component
 * Provides search functionality with filters and results display
 */

import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '@/stores/appStore'
import { StoryCard } from '../stories/StoryCard'

/**
 * Search view component
 */
export function SearchView() {
  const { 
    searchQuery, 
    setSearchQuery, 
    filteredStories, 
    isLoading,
    setCurrentView,
    selectStory 
  } = useAppStore()
  
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [showFilters, setShowFilters] = useState(false)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(localQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [localQuery, setSearchQuery])

  const handleStorySelect = (storyId: string) => {
    selectStory(storyId)
  }

  const handleClose = () => {
    setCurrentView('feed')
  }

  const clearSearch = () => {
    setLocalQuery('')
    setSearchQuery('')
  }

  return (
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark">
      {/* Search Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search stories, publications, or topics..."
              className="input-field w-full pl-10 pr-10"
              autoFocus
            />
            {localQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="btn-ghost p-2"
            aria-label="Close search"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search Stats */}
        {searchQuery && (
          <div className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {isLoading ? (
              'Searching...'
            ) : (
              `Found ${filteredStories.length} ${filteredStories.length === 1 ? 'story' : 'stories'} for "${searchQuery}"`
            )}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Add filter controls here */}
            <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Advanced filters coming soon...
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery ? (
          /* Search Suggestions */
          <div className="p-8 text-center">
            <MagnifyingGlassIcon className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Search Your Stories
            </h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Find articles by title, content, publication, or topic
            </p>

            {/* Search Suggestions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                Try searching for:
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {['AI', 'Technology', 'Business', 'Science', 'Design'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setLocalQuery(suggestion)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : isLoading ? (
          /* Loading State */
          <div className="p-8 text-center">
            <div className="spinner mb-4"></div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Searching stories...
            </p>
          </div>
        ) : filteredStories.length === 0 ? (
          /* No Results */
          <div className="p-8 text-center">
            <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              No stories found
            </h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              We couldn't find any stories matching "{searchQuery}"
            </p>
            <div className="space-y-2">
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Try:
              </p>
              <ul className="text-sm text-text-secondary-light dark:text-text-secondary-dark space-y-1">
                <li>• Using different keywords</li>
                <li>• Checking your spelling</li>
                <li>• Using broader search terms</li>
                <li>• Searching for publication names</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Search Results */
          <div className="p-4 space-y-4">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={() => handleStorySelect(story.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 