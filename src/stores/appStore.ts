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
  DEFAULT_SMART_VIEWS
} from '@/types'

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

// Default sort options
const DEFAULT_SORT: SortOptions = {
  field: 'importance_score',
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
  selectStory: (storyId: string | null) => void
  markStoryAsRead: (storyId: string, isRead: boolean) => void
  toggleStoryBookmark: (storyId: string) => void
  
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
            
            // Load ALL stories first (without read status filter to ensure we get everything)
            const loadAllFilters = {
              ...state.filters,
              readStatus: 'all' as const // Override to get all stories regardless of read status
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

            const filteredStories = applyFiltersAndSort(stories, state.filters, state.sort, state.searchQuery)
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
                const smartViewFiltered = applyFiltersAndSort(stories, activeView.filters, activeView.sort, '')
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

      selectStory: (storyId) => {
        set({ 
          selectedStoryId: storyId,
          currentView: storyId ? 'reading' : 'feed'
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

      // Filter and search actions
      setFilters: (newFilters) => {
        set((state) => {
          const updatedFilters = { ...state.filters, ...newFilters }
          return {
            filters: updatedFilters,
            filteredStories: applyFiltersAndSort(state.stories, updatedFilters, state.sort, state.searchQuery)
          }
        })
      },

      resetFilters: () => {
        set((state) => ({
          filters: DEFAULT_FILTERS,
          filteredStories: applyFiltersAndSort(state.stories, DEFAULT_FILTERS, state.sort, state.searchQuery)
        }))
      },

      setSort: (sort) => {
        set((state) => ({
          sort,
          filteredStories: applyFiltersAndSort(state.stories, state.filters, sort, state.searchQuery)
        }))
      },

      setSearchQuery: (query) => {
        set((state) => ({
          searchQuery: query,
          filteredStories: applyFiltersAndSort(state.stories, state.filters, state.sort, query)
        }))
      },

      applySmartView: (view) => {
        console.log('[AppStore] Applying smart view:', view.name, view.id)
        console.log('[AppStore] Smart view filters:', view.filters)
        set((state) => {
          const updatedFilters = view.filters
          const updatedSort = view.sort
          const filteredStories = applyFiltersAndSort(state.stories, updatedFilters, updatedSort, '')
          console.log('[AppStore] Stories after applying smart view:', {
            totalStories: state.stories.length,
            filteredStories: filteredStories.length,
            viewName: view.name
          })
          return {
            filters: updatedFilters,
            sort: updatedSort,
            activeSmartView: view.id,
            searchQuery: '',
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
        smartViews: state.smartViews,
        sidebarVisible: state.sidebarVisible,
        filters: state.filters,
        sort: state.sort
      })
    }
  )
)

/**
 * Apply filters, sorting, and search to stories array
 */
function applyFiltersAndSort(
  stories: Story[], 
  filters: FilterOptions, 
  sort: SortOptions, 
  searchQuery: string
): Story[] {
  console.log('[applyFiltersAndSort] Starting with:', {
    storiesCount: stories.length,
    filters,
    sort,
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
    console.log('[applyFiltersAndSort] Filtering for read stories only')
    const beforeReadFilter = filtered.length
    filtered = filtered.filter(story => story.is_read)
    console.log(`[applyFiltersAndSort] After read filter: ${beforeReadFilter} -> ${filtered.length}`)
  } else if (filters.readStatus === 'unread') {
    console.log('[applyFiltersAndSort] Filtering for unread stories only')
    const beforeUnreadFilter = filtered.length
    filtered = filtered.filter(story => !story.is_read)
    console.log(`[applyFiltersAndSort] After unread filter: ${beforeUnreadFilter} -> ${filtered.length}`)
  }

  if (filters.bookmarkedOnly) {
    filtered = filtered.filter(story => story.is_bookmarked)
  }

  if (filters.contentTypes && filters.contentTypes.length > 0) {
    console.log('[applyFiltersAndSort] Filtering by content types:', filters.contentTypes)
    const beforeContentTypeFilter = filtered.length
    filtered = filtered.filter(story => filters.contentTypes.includes(story.content_type))
    console.log(`[applyFiltersAndSort] After content type filter: ${beforeContentTypeFilter} -> ${filtered.length}`)
  }

  if (filters.publications.length > 0) {
    filtered = filtered.filter(story => filters.publications.includes(story.publication_name))
  }

  if (filters.categories.length > 0) {
    filtered = filtered.filter(story => story.category && filters.categories.includes(story.category))
  }

  if (filters.importanceMin > 0) {
    console.log('[applyFiltersAndSort] Applying importance min filter:', filters.importanceMin)
    const beforeImportanceFilter = filtered.length
    filtered = filtered.filter(story => {
      const importance = story.importance_score || 0
      const passes = importance >= filters.importanceMin
      if (!passes) {
        console.log(`[applyFiltersAndSort] Story "${story.title}" filtered out by importance - score: ${importance}, min: ${filters.importanceMin}`)
      }
      return passes
    })
    console.log(`[applyFiltersAndSort] After importance min filter: ${beforeImportanceFilter} -> ${filtered.length}`)
  }

  if (filters.importanceMax < 10) {
    console.log('[applyFiltersAndSort] Applying importance max filter:', filters.importanceMax)
    filtered = filtered.filter(story => (story.importance_score || 0) <= filters.importanceMax)
  }

  if (filters.dateRange.start) {
    console.log('[applyFiltersAndSort] Applying date range start filter:', filters.dateRange.start)
    try {
      const startDate = filters.dateRange.start instanceof Date 
        ? filters.dateRange.start 
        : new Date(filters.dateRange.start)
      if (!isNaN(startDate.getTime())) {
        const beforeDateFilter = filtered.length
        filtered = filtered.filter(story => {
          const storyDate = new Date(story.created_at)
          const passes = storyDate >= startDate
          if (!passes) {
            console.log(`[applyFiltersAndSort] Story "${story.title}" filtered out by date - story: ${storyDate}, filter: ${startDate}`)
          }
          return passes
        })
        console.log(`[applyFiltersAndSort] After date start filter: ${beforeDateFilter} -> ${filtered.length}`)
      }
    } catch (error) {
      console.warn('[applyFiltersAndSort] Invalid start date in filters:', filters.dateRange.start)
    }
  }

  if (filters.dateRange.end) {
    console.log('[applyFiltersAndSort] Applying date range end filter:', filters.dateRange.end)
    try {
      const endDate = filters.dateRange.end instanceof Date 
        ? filters.dateRange.end 
        : new Date(filters.dateRange.end)
      if (!isNaN(endDate.getTime())) {
        filtered = filtered.filter(story => new Date(story.created_at) <= endDate)
      }
    } catch (error) {
      console.warn('[applyFiltersAndSort] Invalid end date in filters:', filters.dateRange.end)
    }
  }

  if (filters.estimatedReadTimeMin !== undefined) {
    console.log('[applyFiltersAndSort] Applying estimated read time min filter:', filters.estimatedReadTimeMin)
    const beforeReadTimeFilter = filtered.length
    filtered = filtered.filter(story => {
      const readTime = story.estimated_read_time || 0
      const passes = readTime >= filters.estimatedReadTimeMin!
      if (!passes) {
        console.log(`[applyFiltersAndSort] Story "${story.title}" filtered out by read time min - time: ${readTime}, min: ${filters.estimatedReadTimeMin}`)
      }
      return passes
    })
    console.log(`[applyFiltersAndSort] After read time min filter: ${beforeReadTimeFilter} -> ${filtered.length}`)
  }

  if (filters.estimatedReadTimeMax !== undefined) {
    console.log('[applyFiltersAndSort] Applying estimated read time max filter:', filters.estimatedReadTimeMax)
    const beforeReadTimeMaxFilter = filtered.length
    filtered = filtered.filter(story => {
      const readTime = story.estimated_read_time || 0
      const passes = readTime <= filters.estimatedReadTimeMax!
      if (!passes) {
        console.log(`[applyFiltersAndSort] Story "${story.title}" filtered out by read time max - time: ${readTime}, max: ${filters.estimatedReadTimeMax}`)
      }
      return passes
    })
    console.log(`[applyFiltersAndSort] After read time max filter: ${beforeReadTimeMaxFilter} -> ${filtered.length}`)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sort.field) {
      case 'importance_score':
        aValue = a.importance_score || 0
        bValue = b.importance_score || 0
        break
      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      case 'publication_name':
        aValue = a.publication_name.toLowerCase()
        bValue = b.publication_name.toLowerCase()
        break
      case 'estimated_read_time':
        aValue = a.estimated_read_time || 0
        bValue = b.estimated_read_time || 0
        break
      default:
        return 0
    }

    if (sort.direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  console.log('[applyFiltersAndSort] Final result:', {
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