/**
 * Custom Hook for Story Management
 * Handles loading stories from Supabase with filtering, pagination, and state management
 */

import { useState, useEffect, useCallback } from 'react'
import { Story, FilterOptions, SortOptions } from '@/types'
import { supabaseService, createSupabaseServiceInstance } from '@/lib/supabase'

export interface UseStoriesOptions {
  filters?: FilterOptions
  sort?: SortOptions
  limit?: number
  offset?: number
  searchQuery?: string
  enableRealtime?: boolean
}

export interface UseStoriesReturn {
  stories: Story[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  updateStoryReadStatus: (storyId: string, isRead: boolean) => Promise<void>
  updateStoryBookmarkStatus: (storyId: string, isBookmarked: boolean) => Promise<void>
}

const DEFAULT_FILTERS: FilterOptions = {
  readStatus: 'all',
  publications: [],
  categories: [],
  importanceMin: 0,
  importanceMax: 10,
  dateRange: {},
  bookmarkedOnly: false
}

const DEFAULT_SORT: SortOptions = {
  field: 'importance_score',
  direction: 'desc'
}

/**
 * Helper function to get Supabase service instance
 */
function getSupabaseService() {
  return supabaseService || createSupabaseServiceInstance()
}

/**
 * Hook to manage stories loading and state
 */
export function useStories(options: UseStoriesOptions = {}): UseStoriesReturn {
  const {
    filters = DEFAULT_FILTERS,
    sort = DEFAULT_SORT,
    limit = 20,
    offset = 0,
    searchQuery = '',
    enableRealtime = false
  } = options

  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentOffset, setCurrentOffset] = useState(offset)

  // Determine if we should use real Supabase or mock data
  const useSupabase = !!(window.electronAPI?.env.SUPABASE_URL && window.electronAPI?.env.SUPABASE_ANON_KEY)
  const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

  /**
   * Load stories from Supabase
   */
  const loadStories = useCallback(async (isRefresh: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      if (!useSupabase) {
        setError('Supabase not configured')
        return
      }

      // Get or initialize Supabase service
      const service = getSupabaseService()
      if (!service) {
        setError('Supabase service not available')
        return
      }

      // Configure Supabase service with user ID
      service.setUserId(userId)

      let result
      if (searchQuery.trim()) {
        result = await service.searchStories(searchQuery, filters, sort, limit)
      } else {
        result = await service.loadStories(filters, sort, limit, isRefresh ? 0 : currentOffset)
      }

      if (result.error) {
        setError(result.error)
      } else {
        const newStories = result.stories
        setStories(isRefresh ? newStories : [...stories, ...newStories])
        setHasMore(newStories.length === limit)
        setTotalCount(prev => isRefresh ? newStories.length : prev + newStories.length)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stories'
      setError(errorMessage)
      console.error('Error loading stories:', err)
    } finally {
      setLoading(false)
    }
  }, [useSupabase, userId, searchQuery, filters, sort, limit, currentOffset, stories])

  /**
   * Load more stories (pagination)
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    const newOffset = currentOffset + limit
    setCurrentOffset(newOffset)
    await loadStories(false)
  }, [loading, hasMore, currentOffset, limit, loadStories])

  /**
   * Refresh stories (reset pagination)
   */
  const refresh = useCallback(async () => {
    setCurrentOffset(0)
    await loadStories(true)
  }, [loadStories])

  /**
   * Update story read status
   */
  const updateStoryReadStatus = useCallback(async (storyId: string, isRead: boolean) => {
    try {
      if (!useSupabase) {
        throw new Error('Supabase not configured')
      }

      const service = getSupabaseService()
      if (!service) {
        throw new Error('Supabase service not available')
      }

      const result = await service.updateStoryReadStatus(storyId, isRead)
      if (result.error) {
        throw new Error(result.error)
      }

      // Update local state
      setStories(prevStories =>
        prevStories.map(story =>
          story.id === storyId
            ? {
                ...story,
                is_read: isRead,
                read_at: isRead ? new Date().toISOString() : undefined,
                updated_at: new Date().toISOString()
              }
            : story
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update read status'
      setError(errorMessage)
      console.error('Error updating read status:', err)
    }
  }, [useSupabase])

  /**
   * Update story bookmark status
   */
  const updateStoryBookmarkStatus = useCallback(async (storyId: string, isBookmarked: boolean) => {
    try {
      if (!useSupabase) {
        throw new Error('Supabase not configured')
      }

      const service = getSupabaseService()
      if (!service) {
        throw new Error('Supabase service not available')
      }

      const result = await service.updateStoryBookmarkStatus(storyId, isBookmarked)
      if (result.error) {
        throw new Error(result.error)
      }

      // Update local state
      setStories(prevStories =>
        prevStories.map(story =>
          story.id === storyId
            ? {
                ...story,
                is_bookmarked: isBookmarked,
                updated_at: new Date().toISOString()
              }
            : story
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bookmark status'
      setError(errorMessage)
      console.error('Error updating bookmark status:', err)
    }
  }, [useSupabase])

  // Load stories on mount and when dependencies change
  useEffect(() => {
    setCurrentOffset(0)
    loadStories(true)
  }, [filters, sort, searchQuery]) // Don't include loadStories in deps to avoid infinite loop

  return {
    stories,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    updateStoryReadStatus,
    updateStoryBookmarkStatus
  }
}

/**
 * Hook to load a single story by ID
 */
export function useStory(storyId: string) {
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const useSupabase = !!(window.electronAPI?.env.SUPABASE_URL && window.electronAPI?.env.SUPABASE_ANON_KEY)
  const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

  useEffect(() => {
    async function loadStory() {
      setLoading(true)
      setError(null)

      try {
        if (!useSupabase) {
          setError('Supabase not configured')
          return
        }

        const service = getSupabaseService()
        if (!service) {
          setError('Supabase service not available')
          return
        }

        service.setUserId(userId)
        const result = await service.loadStory(storyId)
        
        if (result.error) {
          setError(result.error)
        } else {
          setStory(result.story)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load story'
        setError(errorMessage)
        console.error('Error loading story:', err)
      } finally {
        setLoading(false)
      }
    }

    if (storyId) {
      loadStory()
    }
  }, [storyId, useSupabase, userId])

  return { story, loading, error }
} 