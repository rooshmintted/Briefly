/**
 * Core TypeScript Types and Interfaces for Briefly Desktop
 * Defines all data structures used throughout the application
 */

// Story and content types
export interface Story {
  id: string
  user_id: string
  publication_name: string
  sender_email?: string
  sender_name?: string
  issue_date?: string // Date as ISO string
  subject_line?: string
  title: string
  summary?: string
  content: string
  html_content?: string
  url?: string
  category?: string
  importance_score?: number
  estimated_read_time?: number // Minutes
  key_points?: string[]
  is_read: boolean
  is_bookmarked: boolean
  read_at?: string // Timestamp as ISO string
  created_at: string
  updated_at: string
  content_type: 'newsletter' | 'video'
  video_url?: string
  video_duration?: number // Minutes for videos
  rating?: number // User rating from 0-10 with 1 decimal precision
}

// Filtered story type for UI components
export interface StoryCard {
  id: string
  title: string
  summary?: string
  publication_name: string
  importance_score?: number
  is_read: boolean
  is_bookmarked: boolean
  category?: string
  estimated_read_time?: number
  created_at: string
  sender_name?: string
  issue_date?: string
}

// Filter and sorting options
export interface FilterOptions {
  readStatus: 'all' | 'read' | 'unread'
  contentTypes: ('newsletter' | 'video')[]
  publications: string[]
  categories: string[]
  importanceMin: number
  importanceMax: number
  dateRange: {
    start?: Date
    end?: Date
  }
  bookmarkedOnly: boolean
  estimatedReadTimeMin?: number
  estimatedReadTimeMax?: number
}

export interface SortOptions {
  field: 'importance_score' | 'created_at' | 'publication_name' | 'estimated_read_time'
  direction: 'asc' | 'desc'
}

// Search functionality
export interface SearchOptions {
  query: string
  filters: FilterOptions
  sort: SortOptions
}

// Reading preferences and settings
export interface ReadingPreferences {
  fontSize: 'small' | 'medium' | 'large'
  lineHeight: 'compact' | 'normal' | 'relaxed'
  contentWidth: 'narrow' | 'medium' | 'wide'
  theme: 'light' | 'dark' | 'auto'
}

export interface AppSettings {
  reading: ReadingPreferences
  notifications: {
    newStoriesEnabled: boolean
    syncCompleteEnabled: boolean
    readingRemindersEnabled: boolean
  }
  sync: {
    autoSyncEnabled: boolean
    syncIntervalMinutes: number
    offlineStorageDays: number
  }
  privacy: {
    analyticsEnabled: boolean
    crashReportingEnabled: boolean
  }
}

// Database and sync types
export interface SyncStatus {
  id: number
  last_sync_at: string
  pending_changes: number
  is_syncing: boolean
  last_error?: string
}

export interface DatabaseAction {
  id: string
  action_type: 'create' | 'update' | 'delete'
  table_name: string
  record_id: string
  data?: any
  created_at: string
  synced: boolean
}

// UI state management
export interface StoryFeedState {
  stories: Story[]
  filteredStories: Story[]
  selectedStoryId: string | null
  isLoading: boolean
  error: string | null
  hasMore: boolean
  filters: FilterOptions
  sort: SortOptions
  searchQuery: string
}

export interface AppState {
  isOnline: boolean
  syncStatus: SyncStatus
  settings: AppSettings
  currentView: 'feed' | 'reading' | 'settings' | 'search' | 'flashcards'
  sidebarVisible: boolean
}

// Component prop types
export interface StoryFeedProps {
  filters: FilterOptions
  sort: SortOptions
  showUnreadOnly: boolean
  onStorySelect: (storyId: string) => void
}

export interface ReadingViewProps {
  storyId: string
  highlightId?: string // Optional highlight to scroll to
  onMarkAsRead: (storyId: string) => void
  onBookmark: (storyId: string) => void
  onNavigate: (direction: 'prev' | 'next') => void
  onClose: () => void
}

// Highlights feature types
export interface Highlight {
  id: string
  user_id: string
  story_id: string
  highlighted_text: string
  start_offset: number
  end_offset: number
  context_before?: string
  context_after?: string
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
  created_at: string
  updated_at: string
}

export interface TextSelection {
  text: string
  startOffset: number
  endOffset: number
  contextBefore: string
  contextAfter: string
  boundingRect: DOMRect
}

// Flashcards feature types
export interface Flashcard {
  id: string
  user_id: string
  story_id: string
  highlight_id?: string | null
  front: string
  back: string
  context_text?: string | null
  tags?: string[] | null
  difficulty?: number
  times_reviewed?: number
  last_reviewed_at?: string | null
  next_review_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateFlashcardData {
  front: string
  back: string
  context_text?: string
  highlight_id?: string
  tags?: string[]
}

export interface UpdateFlashcardData {
  front?: string
  back?: string
  context_text?: string
  tags?: string[]
  difficulty?: number
}

export interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  onSearch: (options: SearchOptions) => void
  placeholder?: string
}

export interface FilterPanelProps {
  filters: FilterOptions
  availablePublications: string[]
  availableCategories: string[]
  onFiltersChange: (filters: FilterOptions) => void
  onReset: () => void
}

// API and service types
export interface SupabaseConfig {
  url: string
  anonKey: string
}

export interface DatabaseConnection {
  supabase: any // Will be typed properly when implementing
  sqlite: any   // Will be typed properly when implementing
}

// Error types
export interface AppError {
  code: string
  message: string
  context?: any
  timestamp: string
}

export interface SyncError extends AppError {
  syncAttempt: number
  recordsAffected: number
}

// Analytics and metrics
export interface ReadingSession {
  id: string
  story_id: string
  start_time: string
  end_time?: string
  reading_progress: number // 0-100
  completed: boolean
}

export interface ReadingMetrics {
  totalStoriesRead: number
  totalReadingTime: number
  averageSessionTime: number
  completionRate: number
  categoriesRead: Record<string, number>
  publicationsRead: Record<string, number>
}

// Smart views and content organization
export interface SmartView {
  id: string
  name: string
  description: string
  filters: FilterOptions
  sort: SortOptions
  isDefault: boolean
  storyCount?: number
}

export const DEFAULT_SMART_VIEWS: SmartView[] = [
  {
    id: 'todays-digest',
    name: "Today's Digest",
    description: 'High-priority stories from your feed',
    filters: {
      readStatus: 'all',
      contentTypes: [],
      publications: [],
      categories: [],
      importanceMin: 7,
      importanceMax: 10,
      dateRange: {},
      bookmarkedOnly: false
    },
    sort: { field: 'importance_score', direction: 'desc' },
    isDefault: true
  },
  {
    id: 'quick-reads',
    name: 'Quick Reads',
    description: 'Stories under 5 minutes',
    filters: {
      readStatus: 'all',
      contentTypes: [],
      publications: [],
      categories: [],
      importanceMin: 0,
      importanceMax: 10,
      dateRange: {},
      bookmarkedOnly: false,
      estimatedReadTimeMin: 0,
      estimatedReadTimeMax: 5
    },
    sort: { field: 'estimated_read_time', direction: 'asc' },
    isDefault: true
  },
  {
    id: 'deep-dives',
    name: 'Deep Dives',
    description: 'Longer-form content (10+ minutes)',
    filters: {
      readStatus: 'all',
      contentTypes: [],
      publications: [],
      categories: [],
      importanceMin: 0,
      importanceMax: 10,
      dateRange: {},
      bookmarkedOnly: false,
      estimatedReadTimeMin: 10,
      estimatedReadTimeMax: 999
    },
    sort: { field: 'importance_score', direction: 'desc' },
    isDefault: true
  },
  {
    id: 'bookmarks',
    name: 'Bookmarks',
    description: 'Saved stories for later',
    filters: {
      readStatus: 'all',
      contentTypes: [],
      publications: [],
      categories: [],
      importanceMin: 0,
      importanceMax: 10,
      dateRange: {},
      bookmarkedOnly: true
    },
    sort: { field: 'created_at', direction: 'desc' },
    isDefault: true
  },
  {
    id: 'highlights',
    name: 'Highlights',
    description: 'Your highlighted text across all stories',
    filters: {
      readStatus: 'all',
      contentTypes: [],
      publications: [],
      categories: [],
      importanceMin: 0,
      importanceMax: 10,
      dateRange: {},
      bookmarkedOnly: false
    },
    sort: { field: 'created_at', direction: 'desc' },
    isDefault: true
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Your study flashcards across all stories',
    filters: {
      readStatus: 'all',
      contentTypes: [],
      publications: [],
      categories: [],
      importanceMin: 0,
      importanceMax: 10,
      dateRange: {},
      bookmarkedOnly: false
    },
    sort: { field: 'created_at', direction: 'desc' },
    isDefault: true
  }
]

// Utility types for better type safety
export type StoryAction = 'read' | 'unread' | 'bookmark' | 'unbookmark'
export type ViewMode = 'card' | 'list' | 'compact'
export type ConnectionStatus = 'online' | 'offline' | 'syncing' | 'error'

// Event types for the app
export interface AppEvent {
  type: string
  payload?: any
  timestamp: string
}

export interface StoryReadEvent extends AppEvent {
  type: 'story_read'
  payload: {
    storyId: string
    readingTime: number
    completionPercentage: number
  }
}

export interface SyncEvent extends AppEvent {
  type: 'sync_complete' | 'sync_start' | 'sync_error'
  payload?: {
    recordsUpdated?: number
    error?: AppError
  }
} 