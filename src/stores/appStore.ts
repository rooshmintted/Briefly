/**
 * Main Application Store using Zustand
 * Manages global app state including stories, filters, settings, and sync status
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  AppState, 
  StoryFeedState, 
  Story, 
  FilterOptions, 
  SortOptions, 
  AppSettings, 
  SyncStatus,
  ReadingPreferences,
  SmartView,
  DEFAULT_SMART_VIEWS,
  Highlight,
  Flashcard,
  CreateFlashcardData,
  UpdateFlashcardData
} from '@/types'
import { parseTimestamp } from '@/lib/dateUtils'

// Default filter options
const DEFAULT_FILTERS: FilterOptions = {
  readStatus: 'all',
  contentTypes: [],
  publications: [],
  categories: [],
  importanceMin: 0,
  importanceMax: 10,
  dateRange: {},
  bookmarkedOnly: false,
  estimatedReadTimeMin: undefined,
  estimatedReadTimeMax: undefined
}

// Default sort options - newest stories first
const DEFAULT_SORT: SortOptions = {
  field: 'created_at',
  direction: 'desc'
}

// Default app settings
const DEFAULT_SETTINGS: AppSettings = {
  reading: {
    fontSize: 'medium',
    lineHeight: 'normal',
    contentWidth: 'medium',
    theme: 'auto'
  },
  notifications: {
    newStoriesEnabled: true,
    syncCompleteEnabled: false,
    readingRemindersEnabled: false
  },
  sync: {
    autoSyncEnabled: true,
    syncIntervalMinutes: 15,
    offlineStorageDays: 30
  },
  privacy: {
    analyticsEnabled: false,
    crashReportingEnabled: true
  }
}

interface AppStore extends AppState, StoryFeedState {
  // Story management actions
  loadStories: () => void
  refreshStories: () => void
  selectStory: (storyId: string | null, highlightId?: string) => void
  markStoryAsRead: (storyId: string, isRead: boolean) => void
  toggleStoryBookmark: (storyId: string) => void
  
  // Selected highlight for scrolling
  selectedHighlightId: string | null
  
  // Highlights management
  highlights: Record<string, Highlight[]> // Key is story ID
  loadStoryHighlights: (storyId: string) => Promise<void>
  createHighlight: (storyId: string, highlightData: {
    highlightedText: string
    startOffset: number
    endOffset: number
    contextBefore?: string
    contextAfter?: string
    color?: string
  }) => Promise<void>
  deleteHighlight: (highlightId: string, storyId: string) => Promise<void>
  loadAllHighlights: () => Promise<void>
  
  // Flashcards management
  flashcards: Record<string, Flashcard[]> // Key is story ID
  allFlashcards: Flashcard[] // All flashcards across stories
  loadStoryFlashcards: (storyId: string) => Promise<void>
  loadAllFlashcards: () => Promise<void>
  createFlashcard: (storyId: string, flashcardData: CreateFlashcardData) => Promise<void>
  updateFlashcard: (flashcardId: string, updates: UpdateFlashcardData) => Promise<void>
  deleteFlashcard: (flashcardId: string, storyId: string) => Promise<void>
  
  // Filter and search actions
  setFilters: (filters: Partial<FilterOptions>) => void
  resetFilters: () => void
  setSort: (sort: SortOptions) => void
  setSearchQuery: (query: string) => void
  applySmartView: (view: SmartView) => void
  
  // Navigation actions
  setCurrentView: (view: AppState['currentView']) => void
  toggleSidebar: () => void
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void
  updateReadingPreferences: (preferences: Partial<ReadingPreferences>) => void
  
  // Sync actions
  updateSyncStatus: (status: Partial<SyncStatus>) => void
  setOnlineStatus: (isOnline: boolean) => void
  
  // Smart views
  smartViews: SmartView[]
  activeSmartView: string | null
  addSmartView: (view: SmartView) => void
  updateSmartView: (id: string, updates: Partial<SmartView>) => void
  deleteSmartView: (id: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      stories: [],
      filteredStories: [],
      selectedStoryId: null,
      isLoading: false,
      error: null,
      hasMore: true,
      filters: DEFAULT_FILTERS,
      sort: DEFAULT_SORT,
      searchQuery: '',
      
      isOnline: navigator.onLine,
      syncStatus: {
        id: 1,
        last_sync_at: '',
        pending_changes: 0,
        is_syncing: false
      },
      settings: DEFAULT_SETTINGS,
      currentView: 'feed',
      sidebarVisible: true,
      
      smartViews: DEFAULT_SMART_VIEWS,
      activeSmartView: null,
      highlights: {},
      selectedHighlightId: null,
      
      // Flashcards initial state
      flashcards: {},
      allFlashcards: [],

      // Story management actions
      loadStories: () => {
        console.log('[AppStore] loadStories called')
        set({ isLoading: true, error: null })
        
        const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'
        
        console.log('[AppStore] Environment check:', {
          userId,
          electronAPI: !!window.electronAPI,
          env: window.electronAPI?.env,
          supabaseUrl: window.electronAPI?.env.SUPABASE_URL ? 'SET' : 'NOT SET',
          supabaseKey: window.electronAPI?.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
        })
        
        const loadFromSupabase = async () => {
          const state = get()
          
          try {
            console.log('[AppStore] Loading Supabase data')
            const { supabaseService, createSupabaseServiceInstance, SupabaseService } = await import('@/lib/supabase')
            
            // Initialize service if not already done
            let service: InstanceType<typeof SupabaseService> | null = supabaseService
            if (!service) {
              console.log('[AppStore] Initializing Supabase service')
              service = await createSupabaseServiceInstance()
            }
            
            if (!service) {
              console.log('[AppStore] Supabase service could not be initialized - credentials not available')
              set({ 
                isLoading: false,
                error: 'Supabase credentials not available. Please check your environment configuration.'
              })
              return
            }

            // Get user ID from environment or stored settings
            let currentUserId = userId
            if (!currentUserId || currentUserId === 'dev-user') {
              try {
                const storedUserId = await window.electronAPI?.getAppSetting('userId')
                if (storedUserId) {
                  currentUserId = storedUserId
                }
              } catch (error) {
                console.warn('[AppStore] Could not retrieve stored user ID:', error)
              }
            }

            service.setUserId(currentUserId)
            
            // Load ALL stories first (without ANY filters to ensure we get everything)
            const loadAllFilters = {
              readStatus: 'all' as const,
              contentTypes: [],
              publications: [],
              categories: [],
              importanceMin: 0,
              importanceMax: 10,
              dateRange: {},
              bookmarkedOnly: false,
              estimatedReadTimeMin: undefined,
              estimatedReadTimeMax: undefined
            }
            console.log('[AppStore] Loading ALL stories from Supabase (including read ones)')
            const result = await service.loadStories(loadAllFilters, state.sort, 100, 0)
            
            if (result.error) {
              console.error('[AppStore] Supabase error:', result.error)
              set({ 
                isLoading: false,
                error: `Error loading stories: ${result.error}`
              })
              return
            }

            const stories = result.stories
            console.log('[AppStore] Successfully loaded stories from Supabase:', stories.length)

            const filteredStories = applyFiltersAndSearch(stories, state.filters, state.searchQuery)
            console.log('[AppStore] Stories after initial filtering:', filteredStories.length)
            
            set({ 
              isLoading: false,
              stories,
              filteredStories,
              error: null
            })

            // Apply the active smart view filters after loading stories
            const currentState = get()
            if (currentState.activeSmartView) {
              console.log('[AppStore] Applying active smart view:', currentState.activeSmartView)
              const activeView = currentState.smartViews.find(v => v.id === currentState.activeSmartView)
              if (activeView) {
                console.log('[AppStore] Found smart view:', activeView.name, activeView.filters)
                const smartViewFiltered = applyFiltersAndSearch(stories, activeView.filters, '')
                console.log('[AppStore] Stories after smart view filtering:', smartViewFiltered.length)
                set({ filteredStories: smartViewFiltered })
              }
            }
          } catch (error) {
            console.error('[AppStore] Error loading from Supabase:', error)
            set({ 
              isLoading: false,
              error: 'Failed to connect to Supabase'
            })
          }
        }

        loadFromSupabase()
      },

      refreshStories: () => {
        const { loadStories } = get()
        loadStories()
      },

      selectStory: (storyId, highlightId) => {
        set((state) => {
          const newState: any = {
            selectedStoryId: storyId,
            selectedHighlightId: highlightId || null,
            currentView: storyId ? 'reading' : 'feed'
          }
          
          // When returning to feed (storyId is null), recalculate filteredStories
          // based on current smart view and filters to ensure proper display
          if (!storyId) {
            let filteredStories: Story[]
            
            if (state.activeSmartView) {
              // If there's an active smart view, apply its filters
              const activeView = state.smartViews.find(v => v.id === state.activeSmartView)
              if (activeView) {
                console.log('[selectStory] Applying active smart view filters when returning to feed:', activeView.name)
                if (activeView.id === 'highlights') {
                  // For highlights view, let StoryFeed handle the display
                  filteredStories = state.stories
                } else {
                  // For other views, apply the smart view's filters
                  filteredStories = applyFiltersAndSearch(state.stories, activeView.filters, '')
                }
              } else {
                // Smart view not found, fall back to current filters
                filteredStories = applyFiltersAndSearch(state.stories, state.filters, state.searchQuery)
              }
            } else {
              // No active smart view, use current filters
              filteredStories = applyFiltersAndSearch(state.stories, state.filters, state.searchQuery)
            }
            
            newState.filteredStories = filteredStories
            console.log('[selectStory] Recalculated filteredStories when returning to feed:', filteredStories.length)
          }
          
          return newState
        })
      },

      markStoryAsRead: (storyId, isRead) => {
        const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'
        
        // Update local state immediately for responsive UI
        set((state) => ({
          stories: state.stories.map(story =>
            story.id === storyId ? { 
              ...story, 
              is_read: isRead,
              read_at: isRead ? new Date().toISOString() : undefined,
              updated_at: new Date().toISOString()
            } : story
          ),
          filteredStories: state.filteredStories.map(story =>
            story.id === storyId ? { 
              ...story, 
              is_read: isRead,
              read_at: isRead ? new Date().toISOString() : undefined,
              updated_at: new Date().toISOString()
            } : story
          )
        }))
        
        // Update backend
        import('@/lib/supabase').then(async ({ supabaseService, createSupabaseServiceInstance }) => {
          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }
          if (service) {
            // Get user ID from environment or stored settings
            let currentUserId = userId
            if (!currentUserId || currentUserId === 'dev-user') {
              try {
                const storedUserId = await window.electronAPI?.getAppSetting('userId')
                if (storedUserId) {
                  currentUserId = storedUserId
                }
              } catch (error) {
                console.warn('Could not retrieve stored user ID for read status update:', error)
              }
            }
            service.setUserId(currentUserId)
            const result = await service.updateStoryReadStatus(storyId, isRead)
            if (result.error) {
              console.error('Error updating read status in Supabase:', result.error)
            }
          } else {
            console.error('Supabase service not available for updating read status')
          }
        })
      },

      toggleStoryBookmark: (storyId) => {
        const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'
        
        set((state) => {
          const story = state.stories.find(s => s.id === storyId)
          if (!story) return state

          const isBookmarked = !story.is_bookmarked

          // Update backend
          import('@/lib/supabase').then(async ({ supabaseService, createSupabaseServiceInstance }) => {
            let service = supabaseService
            if (!service) {
              service = await createSupabaseServiceInstance()
            }
            if (service) {
              // Get user ID from environment or stored settings
              let currentUserId = userId
              if (!currentUserId || currentUserId === 'dev-user') {
                try {
                  const storedUserId = await window.electronAPI?.getAppSetting('userId')
                  if (storedUserId) {
                    currentUserId = storedUserId
                  }
                } catch (error) {
                  console.warn('Could not retrieve stored user ID for bookmark update:', error)
                }
              }
              service.setUserId(currentUserId)
              const result = await service.updateStoryBookmarkStatus(storyId, isBookmarked)
              if (result.error) {
                console.error('Error updating bookmark status in Supabase:', result.error)
              }
            } else {
              console.error('Supabase service not available for updating bookmark status')
            }
          })

          return {
            stories: state.stories.map(s =>
              s.id === storyId ? { 
                ...s, 
                is_bookmarked: isBookmarked,
                updated_at: new Date().toISOString()
              } : s
            ),
            filteredStories: state.filteredStories.map(s =>
              s.id === storyId ? { 
                ...s, 
                is_bookmarked: isBookmarked,
                updated_at: new Date().toISOString()
              } : s
            )
          }
        })
      },

      // Highlights management actions
      loadStoryHighlights: async (storyId: string) => {
        try {
          const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
          const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }

          if (!service) {
            console.error('Supabase service not available for loading highlights')
            return
          }

          let currentUserId = userId
          if (!currentUserId || currentUserId === 'dev-user') {
            try {
              const storedUserId = await window.electronAPI?.getAppSetting('userId')
              if (storedUserId) {
                currentUserId = storedUserId
              }
            } catch (error) {
              console.warn('Could not retrieve stored user ID for highlights:', error)
            }
          }

          service.setUserId(currentUserId)
          const result = await service.getStoryHighlights(storyId)

          if (result.error) {
            console.error('Error loading story highlights:', result.error)
            return
          }

          set((state) => ({
            highlights: {
              ...state.highlights,
              [storyId]: result.highlights
            }
          }))
        } catch (error) {
          console.error('Error in loadStoryHighlights:', error)
        }
      },

      createHighlight: async (storyId: string, highlightData) => {
        try {
          const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
          const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }

          if (!service) {
            console.error('Supabase service not available for creating highlight')
            return
          }

          let currentUserId = userId
          if (!currentUserId || currentUserId === 'dev-user') {
            try {
              const storedUserId = await window.electronAPI?.getAppSetting('userId')
              if (storedUserId) {
                currentUserId = storedUserId
              }
            } catch (error) {
              console.warn('Could not retrieve stored user ID for highlight creation:', error)
            }
          }

          service.setUserId(currentUserId)
          const result = await service.createHighlight({ storyId, ...highlightData })

          if (result.error) {
            console.error('Error creating highlight:', result.error)
            return
          }

          if (result.highlight) {
            set((state) => ({
              highlights: {
                ...state.highlights,
                [storyId]: [...(state.highlights[storyId] || []), result.highlight!]
              }
            }))
          }
        } catch (error) {
          console.error('Error in createHighlight:', error)
        }
      },

      deleteHighlight: async (highlightId: string, storyId: string) => {
        try {
          const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
          const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }

          if (!service) {
            console.error('Supabase service not available for deleting highlight')
            return
          }

          let currentUserId = userId
          if (!currentUserId || currentUserId === 'dev-user') {
            try {
              const storedUserId = await window.electronAPI?.getAppSetting('userId')
              if (storedUserId) {
                currentUserId = storedUserId
              }
            } catch (error) {
              console.warn('Could not retrieve stored user ID for highlight deletion:', error)
            }
          }

          service.setUserId(currentUserId)
          const result = await service.deleteHighlight(highlightId)

          if (result.error) {
            console.error('Error deleting highlight:', result.error)
            return
          }

          set((state) => ({
            highlights: {
              ...state.highlights,
              [storyId]: (state.highlights[storyId] || []).filter(h => h.id !== highlightId)
            }
          }))
        } catch (error) {
          console.error('Error in deleteHighlight:', error)
        }
      },

      loadAllHighlights: async () => {
        try {
          const state = get()
          const storyIds = state.stories.map(story => story.id)
          
          // Load highlights for all stories that don't already have highlights loaded
          const loadPromises = storyIds
            .filter(storyId => !state.highlights[storyId])
            .map(storyId => state.loadStoryHighlights(storyId))
          
          await Promise.all(loadPromises)
        } catch (error) {
          console.error('Error in loadAllHighlights:', error)
        }
      },

      // Flashcards management actions
      loadStoryFlashcards: async (storyId: string) => {
        try {
          const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
          const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }

          if (!service) {
            console.error('Supabase service not available for loading flashcards')
            return
          }

          let currentUserId = userId
          if (!currentUserId || currentUserId === 'dev-user') {
            try {
              const storedUserId = await window.electronAPI?.getAppSetting('userId')
              if (storedUserId) {
                currentUserId = storedUserId
              }
            } catch (error) {
              console.warn('Could not retrieve stored user ID for flashcards:', error)
            }
          }

          service.setUserId(currentUserId)
          const result = await service.getStoryFlashcards(storyId)

          if (result.error) {
            console.error('Error loading story flashcards:', result.error)
            return
          }

          set((state) => ({
            flashcards: {
              ...state.flashcards,
              [storyId]: result.flashcards
            }
          }))
        } catch (error) {
          console.error('Error in loadStoryFlashcards:', error)
        }
      },

      loadAllFlashcards: async () => {
        try {
          const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
          const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }

          if (!service) {
            console.error('Supabase service not available for loading all flashcards')
            return
          }

          let currentUserId = userId
          if (!currentUserId || currentUserId === 'dev-user') {
            try {
              const storedUserId = await window.electronAPI?.getAppSetting('userId')
              if (storedUserId) {
                currentUserId = storedUserId
              }
            } catch (error) {
              console.warn('Could not retrieve stored user ID for all flashcards:', error)
            }
          }

          service.setUserId(currentUserId)
          const result = await service.getAllFlashcards()

          if (result.error) {
            console.error('Error loading all flashcards:', result.error)
            return
          }

          set((state) => ({
            allFlashcards: result.flashcards
          }))
        } catch (error) {
          console.error('Error in loadAllFlashcards:', error)
        }
      },

      createFlashcard: async (storyId: string, flashcardData: CreateFlashcardData) => {
        try {
          const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
          const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }

          if (!service) {
            console.error('Supabase service not available for creating flashcard')
            return
          }

          let currentUserId = userId
          if (!currentUserId || currentUserId === 'dev-user') {
            try {
              const storedUserId = await window.electronAPI?.getAppSetting('userId')
              if (storedUserId) {
                currentUserId = storedUserId
              }
            } catch (error) {
              console.warn('Could not retrieve stored user ID for flashcard creation:', error)
            }
          }

          service.setUserId(currentUserId)
          const result = await service.createFlashcard(storyId, flashcardData)

          if (result.error) {
            console.error('Error creating flashcard:', result.error)
            return
          }

          if (result.flashcard) {
            set((state) => ({
              flashcards: {
                ...state.flashcards,
                [storyId]: [...(state.flashcards[storyId] || []), result.flashcard!]
              },
              allFlashcards: [...state.allFlashcards, result.flashcard!]
            }))
          }
        } catch (error) {
          console.error('Error in createFlashcard:', error)
        }
      },

      updateFlashcard: async (flashcardId: string, updates: UpdateFlashcardData) => {
        try {
          const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
          const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }

          if (!service) {
            console.error('Supabase service not available for updating flashcard')
            return
          }

          let currentUserId = userId
          if (!currentUserId || currentUserId === 'dev-user') {
            try {
              const storedUserId = await window.electronAPI?.getAppSetting('userId')
              if (storedUserId) {
                currentUserId = storedUserId
              }
            } catch (error) {
              console.warn('Could not retrieve stored user ID for flashcard update:', error)
            }
          }

          service.setUserId(currentUserId)
          const result = await service.updateFlashcard(flashcardId, updates)

          if (result.error) {
            console.error('Error updating flashcard:', result.error)
            return
          }

          if (result.flashcard) {
            set((state) => ({
              flashcards: Object.fromEntries(
                Object.entries(state.flashcards).map(([storyId, cards]) => [
                  storyId,
                  cards.map(card => card.id === flashcardId ? result.flashcard! : card)
                ])
              ),
              allFlashcards: state.allFlashcards.map(card => 
                card.id === flashcardId ? result.flashcard! : card
              )
            }))
          }
        } catch (error) {
          console.error('Error in updateFlashcard:', error)
        }
      },

      deleteFlashcard: async (flashcardId: string, storyId: string) => {
        try {
          const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
          const userId = window.electronAPI?.env.DEV_USER_ID || 'dev-user'

          let service = supabaseService
          if (!service) {
            service = await createSupabaseServiceInstance()
          }

          if (!service) {
            console.error('Supabase service not available for deleting flashcard')
            return
          }

          let currentUserId = userId
          if (!currentUserId || currentUserId === 'dev-user') {
            try {
              const storedUserId = await window.electronAPI?.getAppSetting('userId')
              if (storedUserId) {
                currentUserId = storedUserId
              }
            } catch (error) {
              console.warn('Could not retrieve stored user ID for flashcard deletion:', error)
            }
          }

          service.setUserId(currentUserId)
          const result = await service.deleteFlashcard(flashcardId)

          if (result.error) {
            console.error('Error deleting flashcard:', result.error)
            return
          }

          set((state) => ({
            flashcards: {
              ...state.flashcards,
              [storyId]: (state.flashcards[storyId] || []).filter(card => card.id !== flashcardId)
            },
            allFlashcards: state.allFlashcards.filter(card => card.id !== flashcardId)
          }))
        } catch (error) {
          console.error('Error in deleteFlashcard:', error)
        }
      },

      // Filter and search actions
      setFilters: (newFilters) => {
        set((state) => {
          const updatedFilters = { ...state.filters, ...newFilters }
          return {
            filters: updatedFilters,
            filteredStories: applyFiltersAndSearch(state.stories, updatedFilters, state.searchQuery)
          }
        })
      },

      resetFilters: () => {
        set((state) => ({
          filters: DEFAULT_FILTERS,
          filteredStories: applyFiltersAndSearch(state.stories, DEFAULT_FILTERS, state.searchQuery)
        }))
      },

      setSort: (sort) => {
        set((state) => ({
          sort,
          filteredStories: applyFiltersAndSearch(state.stories, state.filters, state.searchQuery)
        }))
      },

      setSearchQuery: (query) => {
        set((state) => ({
          searchQuery: query,
          filteredStories: applyFiltersAndSearch(state.stories, state.filters, query)
        }))
      },

      applySmartView: (view) => {
        console.log('[AppStore] ===== APPLYING SMART VIEW =====')
        console.log('[AppStore] View:', view.name, view.id)
        console.log('[AppStore] View filters:', view.filters)
        console.log('[AppStore] Current active smart view before:', get().activeSmartView)
        
        set((state) => {
          const updatedFilters = view.filters
          const updatedSort = view.sort
          
          // Always recalculate filtered stories from the base stories array
          // This ensures we start fresh and don't carry over previous filters
          let filteredStories: Story[]
          
          if (view.id === 'highlights') {
            // For highlights view, let StoryFeed handle the display but still reset other state
            filteredStories = state.stories
          } else {
            // For all other views, apply the smart view's filters
            filteredStories = applyFiltersAndSearch(state.stories, updatedFilters, '')
            console.log('[AppStore] Stories after applying smart view:', {
              totalStories: state.stories.length,
              filteredStories: filteredStories.length,
              viewName: view.name,
              appliedFilters: updatedFilters,
              firstFewFiltered: filteredStories.slice(0, 3).map(s => ({
                title: s.title.substring(0, 40),
                importance: s.importance_score,
                readTime: s.estimated_read_time
              }))
            })
          }
          
          console.log('[AppStore] Setting new state with filtered stories count:', filteredStories.length)
          console.log('[AppStore] New active smart view will be:', view.id)
          
          return {
            filters: updatedFilters,
            sort: updatedSort,
            activeSmartView: view.id,
            currentView: 'feed',
            searchQuery: '', // Clear any existing search
            filteredStories
          }
        })
      },

      // Navigation actions
      setCurrentView: (view) => {
        set({ currentView: view })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarVisible: !state.sidebarVisible }))
      },

      // Settings actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      updateReadingPreferences: (preferences) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reading: { ...state.settings.reading, ...preferences }
          }
        }))
      },

      // Sync actions
      updateSyncStatus: (status) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, ...status }
        }))
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline })
      },

      // Smart views
      addSmartView: (view) => {
        set((state) => ({
          smartViews: [...state.smartViews, view]
        }))
      },

      updateSmartView: (id, updates) => {
        set((state) => ({
          smartViews: state.smartViews.map(view =>
            view.id === id ? { ...view, ...updates } : view
          )
        }))
      },

      deleteSmartView: (id) => {
        set((state) => ({
          smartViews: state.smartViews.filter(view => view.id !== id && view.isDefault !== true)
        }))
      }
    }),
    {
      name: 'briefly-app-store',
      partialize: (state) => ({
        settings: state.settings,
        sidebarVisible: state.sidebarVisible,
        filters: state.filters,
        sort: state.sort
        // Don't persist smartViews - always use DEFAULT_SMART_VIEWS to ensure new views are included
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always ensure we have the latest smart views including highlights
          state.smartViews = DEFAULT_SMART_VIEWS
          console.log('[Store] Rehydrated with updated smart views:', state.smartViews.map(v => v.id))
        }
      }
    }
  )
)

/**
 * Apply filters and search to stories array
 * Note: Sorting is handled at the database level in Supabase
 */
function applyFiltersAndSearch(
  stories: Story[], 
  filters: FilterOptions, 
  searchQuery: string
): Story[] {
  console.log('[applyFiltersAndSearch] Starting with:', {
    storiesCount: stories.length,
    filters,
    searchQuery
  })
  
  let filtered = [...stories]

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(story =>
      story.title.toLowerCase().includes(query) ||
      story.summary?.toLowerCase().includes(query) ||
      story.content.toLowerCase().includes(query) ||
      story.publication_name.toLowerCase().includes(query)
    )
  }

  // Apply filters
  if (filters.readStatus === 'read') {
    console.log('[applyFiltersAndSearch] Filtering for read stories only')
    const beforeReadFilter = filtered.length
    filtered = filtered.filter(story => story.is_read)
    console.log(`[applyFiltersAndSearch] After read filter: ${beforeReadFilter} -> ${filtered.length}`)
  } else if (filters.readStatus === 'unread') {
    console.log('[applyFiltersAndSearch] Filtering for unread stories only')
    const beforeUnreadFilter = filtered.length
    filtered = filtered.filter(story => !story.is_read)
    console.log(`[applyFiltersAndSearch] After unread filter: ${beforeUnreadFilter} -> ${filtered.length}`)
  }

  if (filters.bookmarkedOnly) {
    filtered = filtered.filter(story => story.is_bookmarked)
  }

  if (filters.contentTypes && filters.contentTypes.length > 0) {
    console.log('[applyFiltersAndSearch] Filtering by content types:', filters.contentTypes)
    const beforeContentTypeFilter = filtered.length
    filtered = filtered.filter(story => filters.contentTypes.includes(story.content_type))
    console.log(`[applyFiltersAndSearch] After content type filter: ${beforeContentTypeFilter} -> ${filtered.length}`)
  }

  if (filters.publications.length > 0) {
    filtered = filtered.filter(story => filters.publications.includes(story.publication_name))
  }

  if (filters.categories.length > 0) {
    filtered = filtered.filter(story => story.category && filters.categories.includes(story.category))
  }

  if (filters.importanceMin > 0) {
    console.log('[applyFiltersAndSearch] Applying importance min filter:', filters.importanceMin)
    console.log('[applyFiltersAndSearch] Sample stories with importance scores:', filtered.slice(0, 5).map(s => ({
      title: s.title.substring(0, 50),
      importance_score: s.importance_score
    })))
    const beforeImportanceFilter = filtered.length
    filtered = filtered.filter(story => {
      const importance = story.importance_score || 0
      const passes = importance >= filters.importanceMin
      if (!passes) {
        console.log(`[applyFiltersAndSearch] Story "${story.title.substring(0, 50)}" filtered out by importance - score: ${importance}, min: ${filters.importanceMin}`)
      } else {
        console.log(`[applyFiltersAndSearch] Story "${story.title.substring(0, 50)}" PASSED importance filter - score: ${importance}, min: ${filters.importanceMin}`)
      }
      return passes
    })
    console.log(`[applyFiltersAndSearch] After importance min filter: ${beforeImportanceFilter} -> ${filtered.length}`)
  }

  if (filters.importanceMax < 10) {
    console.log('[applyFiltersAndSearch] Applying importance max filter:', filters.importanceMax)
    filtered = filtered.filter(story => (story.importance_score || 0) <= filters.importanceMax)
  }

  if (filters.dateRange.start) {
    console.log('[applyFiltersAndSearch] Applying date range start filter:', filters.dateRange.start)
    try {
      const startDate = filters.dateRange.start instanceof Date 
        ? filters.dateRange.start 
        : new Date(filters.dateRange.start)
      if (!isNaN(startDate.getTime())) {
        const beforeDateFilter = filtered.length
        filtered = filtered.filter(story => {
          const storyDate = parseTimestamp(story.created_at)
          const passes = storyDate ? storyDate >= startDate : false
          if (!passes) {
            console.log(`[applyFiltersAndSearch] Story "${story.title}" filtered out by date - story: ${storyDate}, filter: ${startDate}`)
          }
          return passes
        })
        console.log(`[applyFiltersAndSearch] After date start filter: ${beforeDateFilter} -> ${filtered.length}`)
      }
    } catch (error) {
      console.warn('[applyFiltersAndSearch] Invalid start date in filters:', filters.dateRange.start)
    }
  }

  if (filters.dateRange.end) {
    console.log('[applyFiltersAndSearch] Applying date range end filter:', filters.dateRange.end)
    try {
      const endDate = filters.dateRange.end instanceof Date 
        ? filters.dateRange.end 
        : new Date(filters.dateRange.end)
      if (!isNaN(endDate.getTime())) {
        filtered = filtered.filter(story => {
          const storyDate = parseTimestamp(story.created_at)
          return storyDate ? storyDate <= endDate : false
        })
      }
    } catch (error) {
      console.warn('[applyFiltersAndSearch] Invalid end date in filters:', filters.dateRange.end)
    }
  }

  if (filters.estimatedReadTimeMin !== undefined) {
    console.log('[applyFiltersAndSearch] Applying estimated read time min filter:', filters.estimatedReadTimeMin)
    const beforeReadTimeFilter = filtered.length
    filtered = filtered.filter(story => {
      const readTime = story.estimated_read_time || 0
      const passes = readTime >= filters.estimatedReadTimeMin!
      if (!passes) {
        console.log(`[applyFiltersAndSearch] Story "${story.title}" filtered out by read time min - time: ${readTime}, min: ${filters.estimatedReadTimeMin}`)
      }
      return passes
    })
    console.log(`[applyFiltersAndSearch] After read time min filter: ${beforeReadTimeFilter} -> ${filtered.length}`)
  }

  if (filters.estimatedReadTimeMax !== undefined) {
    console.log('[applyFiltersAndSearch] Applying estimated read time max filter:', filters.estimatedReadTimeMax)
    const beforeReadTimeMaxFilter = filtered.length
    filtered = filtered.filter(story => {
      const readTime = story.estimated_read_time || 0
      const passes = readTime <= filters.estimatedReadTimeMax!
      if (!passes) {
        console.log(`[applyFiltersAndSearch] Story "${story.title}" filtered out by read time max - time: ${readTime}, max: ${filters.estimatedReadTimeMax}`)
      }
      return passes
    })
    console.log(`[applyFiltersAndSearch] After read time max filter: ${beforeReadTimeMaxFilter} -> ${filtered.length}`)
  }

  console.log('[applyFiltersAndSearch] Final result:', {
    originalCount: stories.length,
    filteredCount: filtered.length,
    filtered: filtered.map(s => ({
      id: s.id,
      title: s.title,
      importance_score: s.importance_score,
      created_at: s.created_at,
      is_read: s.is_read
    }))
  })

  return filtered
} 