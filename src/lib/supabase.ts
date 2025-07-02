/**
 * Supabase Service for Briefly Desktop
 * Handles direct connections to Supabase for loading stories
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Story, FilterOptions, SortOptions, Highlight, Flashcard, CreateFlashcardData, UpdateFlashcardData } from '@/types'

export class SupabaseService {
  private supabase: SupabaseClient
  private userId: string | null = null

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Set the current user ID for queries
   */
  setUserId(userId: string): void {
    this.userId = userId
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId
  }

  /**
   * Load stories from Supabase with filtering and pagination
   */
  async loadStories(
    filters?: FilterOptions,
    sort?: SortOptions,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ stories: Story[]; error?: string }> {
    console.log('[SupabaseService] loadStories called with:', { 
      userId: this.userId, 
      filters, 
      sort, 
      limit, 
      offset 
    })

    if (!this.userId) {
      console.log('[SupabaseService] No user ID set, returning empty stories')
      return { stories: [], error: 'User ID not set' }
    }

    try {
      let query = this.supabase
        .from('stories')
        .select('*')
        .eq('user_id', this.userId)

      console.log('[SupabaseService] Base query created for user:', this.userId)

      // Apply filters
      if (filters) {
        if (filters.readStatus === 'read') {
          query = query.eq('is_read', true)
        } else if (filters.readStatus === 'unread') {
          query = query.eq('is_read', false)
        }

        if (filters.bookmarkedOnly) {
          query = query.eq('is_bookmarked', true)
        }

        if (filters.contentTypes && filters.contentTypes.length > 0) {
          query = query.in('content_type', filters.contentTypes)
        }

        if (filters.publications.length > 0) {
          query = query.in('publication_name', filters.publications)
        }

        if (filters.categories.length > 0) {
          query = query.in('category', filters.categories)
        }

        if (filters.importanceMin > 0) {
          query = query.gte('importance_score', filters.importanceMin)
        }

        if (filters.importanceMax < 10) {
          query = query.lte('importance_score', filters.importanceMax)
        }

        if (filters.dateRange.start) {
          try {
            const startDate = filters.dateRange.start instanceof Date 
              ? filters.dateRange.start 
              : new Date(filters.dateRange.start)
            if (!isNaN(startDate.getTime())) {
              query = query.gte('created_at', startDate.toISOString())
            }
          } catch (error) {
            console.warn('[SupabaseService] Invalid start date in filters:', filters.dateRange.start)
          }
        }

        if (filters.dateRange.end) {
          try {
            const endDate = filters.dateRange.end instanceof Date 
              ? filters.dateRange.end 
              : new Date(filters.dateRange.end)
            if (!isNaN(endDate.getTime())) {
              query = query.lte('created_at', endDate.toISOString())
            }
          } catch (error) {
            console.warn('[SupabaseService] Invalid end date in filters:', filters.dateRange.end)
          }
        }

        if (filters.estimatedReadTimeMin !== undefined) {
          query = query.gte('estimated_read_time', filters.estimatedReadTimeMin)
        }

        if (filters.estimatedReadTimeMax !== undefined) {
          query = query.lte('estimated_read_time', filters.estimatedReadTimeMax)
        }
      }

      // Apply sorting
      if (sort) {
        const ascending = sort.direction === 'asc'
        query = query.order(sort.field, { ascending })
      } else {
        // Default sort: created_at desc (most recent first)
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('[SupabaseService] Error loading stories from Supabase:', error)
        return { stories: [], error: error.message }
      }

      console.log('[SupabaseService] Successfully loaded stories:', {
        count: data?.length || 0,
        stories: data?.map(s => ({ id: s.id, title: s.title, importance_score: s.importance_score })) || []
      })

      return { stories: data || [] }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in loadStories:', err)
      return { stories: [], error: errorMessage }
    }
  }

  /**
   * Load a single story by ID
   */
  async loadStory(storyId: string): Promise<{ story: Story | null; error?: string }> {
    if (!this.userId) {
      return { story: null, error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', this.userId)
        .single()

      if (error) {
        console.error('Error loading story from Supabase:', error)
        return { story: null, error: error.message }
      }

      return { story: data }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in loadStory:', err)
      return { story: null, error: errorMessage }
    }
  }

  /**
   * Search stories in Supabase
   */
  async searchStories(
    searchQuery: string,
    filters?: FilterOptions,
    sort?: SortOptions,
    limit: number = 50
  ): Promise<{ stories: Story[]; error?: string }> {
    if (!this.userId) {
      return { stories: [], error: 'User ID not set' }
    }

    try {
      let query = this.supabase
        .from('stories')
        .select('*')
        .eq('user_id', this.userId)

      // Apply text search - using Supabase's text search capabilities
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,publication_name.ilike.%${searchQuery}%`)
      }

      // Apply additional filters
      if (filters) {
        if (filters.readStatus === 'read') {
          query = query.eq('is_read', true)
        } else if (filters.readStatus === 'unread') {
          query = query.eq('is_read', false)
        }

        if (filters.bookmarkedOnly) {
          query = query.eq('is_bookmarked', true)
        }

        if (filters.contentTypes && filters.contentTypes.length > 0) {
          query = query.in('content_type', filters.contentTypes)
        }

        if (filters.publications.length > 0) {
          query = query.in('publication_name', filters.publications)
        }

        if (filters.categories.length > 0) {
          query = query.in('category', filters.categories)
        }
      }

      // Apply sorting
      if (sort) {
        const ascending = sort.direction === 'asc'
        query = query.order(sort.field, { ascending })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      query = query.limit(limit)

      const { data, error } = await query

      if (error) {
        console.error('Error searching stories in Supabase:', error)
        return { stories: [], error: error.message }
      }

      return { stories: data || [] }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in searchStories:', err)
      return { stories: [], error: errorMessage }
    }
  }

  /**
   * Update story read status
   */
  async updateStoryReadStatus(storyId: string, isRead: boolean): Promise<{ success: boolean; error?: string }> {
    if (!this.userId) {
      return { success: false, error: 'User ID not set' }
    }

    try {
      const updateData: any = {
        is_read: isRead,
        updated_at: new Date().toISOString()
      }

      if (isRead) {
        updateData.read_at = new Date().toISOString()
      } else {
        updateData.read_at = null
      }

      const { error } = await this.supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)
        .eq('user_id', this.userId)

      if (error) {
        console.error('Error updating story read status:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in updateStoryReadStatus:', err)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Update story bookmark status
   */
  async updateStoryBookmarkStatus(storyId: string, isBookmarked: boolean): Promise<{ success: boolean; error?: string }> {
    if (!this.userId) {
      return { success: false, error: 'User ID not set' }
    }

    try {
      const { error } = await this.supabase
        .from('stories')
        .update({
          is_bookmarked: isBookmarked,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .eq('user_id', this.userId)

      if (error) {
        console.error('Error updating story bookmark status:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in updateStoryBookmarkStatus:', err)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Update story rating
   */
  async updateStoryRating(storyId: string, rating: number): Promise<{ success: boolean; error?: string }> {
    if (!this.userId) {
      return { success: false, error: 'User ID not set' }
    }

    try {
      // Ensure rating is within valid range and has proper precision
      const validRating = Math.min(10, Math.max(0, Math.round(rating * 10) / 10))

      const { error } = await this.supabase
        .from('stories')
        .update({
          rating: validRating,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .eq('user_id', this.userId)

      if (error) {
        console.error('Error updating story rating:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in updateStoryRating:', err)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Create a new highlight for a story
   */
  async createHighlight(highlightData: {
    storyId: string
    highlightedText: string
    startOffset: number
    endOffset: number
    contextBefore?: string
    contextAfter?: string
    color?: string
  }): Promise<{ highlight: Highlight | null; error?: string }> {
    if (!this.userId) {
      return { highlight: null, error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('highlights')
        .insert({
          user_id: this.userId,
          story_id: highlightData.storyId,
          highlighted_text: highlightData.highlightedText,
          start_offset: highlightData.startOffset,
          end_offset: highlightData.endOffset,
          context_before: highlightData.contextBefore,
          context_after: highlightData.contextAfter,
          color: highlightData.color || 'yellow',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating highlight:', error)
        return { highlight: null, error: error.message }
      }

      return { highlight: data }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in createHighlight:', err)
      return { highlight: null, error: errorMessage }
    }
  }

  /**
   * Get all highlights for a story
   */
  async getStoryHighlights(storyId: string): Promise<{ highlights: Highlight[]; error?: string }> {
    if (!this.userId) {
      return { highlights: [], error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('highlights')
        .select('*')
        .eq('user_id', this.userId)
        .eq('story_id', storyId)
        .order('start_offset', { ascending: true })

      if (error) {
        console.error('Error loading highlights:', error)
        return { highlights: [], error: error.message }
      }

      return { highlights: data || [] }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in getStoryHighlights:', err)
      return { highlights: [], error: errorMessage }
    }
  }

  /**
   * Delete a highlight
   */
  async deleteHighlight(highlightId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.userId) {
      return { success: false, error: 'User ID not set' }
    }

    try {
      const { error } = await this.supabase
        .from('highlights')
        .delete()
        .eq('id', highlightId)
        .eq('user_id', this.userId)

      if (error) {
        console.error('Error deleting highlight:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in deleteHighlight:', err)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Create a new flashcard for a story
   */
  async createFlashcard(storyId: string, flashcardData: CreateFlashcardData): Promise<{ flashcard: Flashcard | null; error?: string }> {
    if (!this.userId) {
      return { flashcard: null, error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .insert({
          user_id: this.userId,
          story_id: storyId,
          front: flashcardData.front,
          back: flashcardData.back,
          context_text: flashcardData.context_text,
          highlight_id: flashcardData.highlight_id,
          tags: flashcardData.tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating flashcard:', error)
        return { flashcard: null, error: error.message }
      }

      return { flashcard: data }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in createFlashcard:', err)
      return { flashcard: null, error: errorMessage }
    }
  }

  /**
   * Get all flashcards for a story
   */
  async getStoryFlashcards(storyId: string): Promise<{ flashcards: Flashcard[]; error?: string }> {
    if (!this.userId) {
      return { flashcards: [], error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', this.userId)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading flashcards:', error)
        return { flashcards: [], error: error.message }
      }

      return { flashcards: data || [] }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in getStoryFlashcards:', err)
      return { flashcards: [], error: errorMessage }
    }
  }

  /**
   * Get all flashcards for a user across all stories
   */
  async getAllFlashcards(): Promise<{ flashcards: Flashcard[]; error?: string }> {
    if (!this.userId) {
      return { flashcards: [], error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading all flashcards:', error)
        return { flashcards: [], error: error.message }
      }

      return { flashcards: data || [] }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in getAllFlashcards:', err)
      return { flashcards: [], error: errorMessage }
    }
  }

  /**
   * Update an existing flashcard
   */
  async updateFlashcard(flashcardId: string, updates: UpdateFlashcardData): Promise<{ flashcard: Flashcard | null; error?: string }> {
    if (!this.userId) {
      return { flashcard: null, error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', flashcardId)
        .eq('user_id', this.userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating flashcard:', error)
        return { flashcard: null, error: error.message }
      }

      return { flashcard: data }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in updateFlashcard:', err)
      return { flashcard: null, error: errorMessage }
    }
  }

  /**
   * Delete a flashcard
   */
  async deleteFlashcard(flashcardId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.userId) {
      return { success: false, error: 'User ID not set' }
    }

    try {
      const { error } = await this.supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId)
        .eq('user_id', this.userId)

      if (error) {
        console.error('Error deleting flashcard:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in deleteFlashcard:', err)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get available publications for filtering
   */
  async getAvailablePublications(): Promise<{ publications: string[]; error?: string }> {
    if (!this.userId) {
      return { publications: [], error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('stories')
        .select('publication_name')
        .eq('user_id', this.userId)
        .not('publication_name', 'is', null)

      if (error) {
        console.error('Error getting publications:', error)
        return { publications: [], error: error.message }
      }

      const publications = [...new Set(data?.map(item => item.publication_name) || [])].sort()
      return { publications }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in getAvailablePublications:', err)
      return { publications: [], error: errorMessage }
    }
  }

  /**
   * Get available categories for filtering
   */
  async getAvailableCategories(): Promise<{ categories: string[]; error?: string }> {
    if (!this.userId) {
      return { categories: [], error: 'User ID not set' }
    }

    try {
      const { data, error } = await this.supabase
        .from('stories')
        .select('category')
        .eq('user_id', this.userId)
        .not('category', 'is', null)

      if (error) {
        console.error('Error getting categories:', error)
        return { categories: [], error: error.message }
      }

      const categories = [...new Set(data?.map(item => item.category) || [])].sort()
      return { categories }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in getAvailableCategories:', err)
      return { categories: [], error: errorMessage }
    }
  }
}

/**
 * Create and configure Supabase service instance
 * Uses Electron's environment variable access pattern with stored credentials fallback
 */
async function createSupabaseService(): Promise<SupabaseService | null> {
  // First try environment variables
  let supabaseUrl = window.electronAPI?.env.SUPABASE_URL
  let supabaseKey = window.electronAPI?.env.SUPABASE_ANON_KEY

  // If environment variables aren't available, try stored credentials
  if (!supabaseUrl || !supabaseKey) {
    try {
      supabaseUrl = await window.electronAPI?.getAppSetting('supabaseUrl')
      supabaseKey = await window.electronAPI?.getAppSetting('supabaseKey')
    } catch (error) {
      console.warn('[SupabaseService] Could not retrieve stored credentials:', error)
    }
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[SupabaseService] Supabase credentials not available')
    return null
  }

  return new SupabaseService(supabaseUrl, supabaseKey)
}

/**
 * Get or create Supabase service instance
 */
async function getSupabaseServiceInstance(): Promise<SupabaseService | null> {
  if (!supabaseService) {
    supabaseService = await createSupabaseService()
  }
  return supabaseService
}

/**
 * Force refresh of Supabase service instance (useful after credentials update)
 */
async function refreshSupabaseService(): Promise<SupabaseService | null> {
  supabaseService = null
  return await getSupabaseServiceInstance()
}

// Export factory function and lazy-initialized service
export const createSupabaseServiceInstance = getSupabaseServiceInstance
export const refreshSupabaseServiceInstance = refreshSupabaseService
export let supabaseService: SupabaseService | null = null

// Initialize service when window.electronAPI is available
if (typeof window !== 'undefined' && window.electronAPI?.env) {
  createSupabaseService().then(service => {
    supabaseService = service
  })
} 