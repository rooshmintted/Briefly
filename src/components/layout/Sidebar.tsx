/**
 * Sidebar Component
 * Contains smart views, filters, and navigation for the story feed
 */

import React, { useEffect, useState, useMemo } from 'react'
import { 
  StarIcon,
  ClockIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  FunnelIcon,
  SparklesIcon,
  PencilIcon,
  AcademicCapIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '@/stores/appStore'
import { SmartView, Story } from '@/types'
import { clsx } from 'clsx'

/**
 * Interface for category data with counts
 */
interface CategoryData {
  name: string
  count: number
}

/**
 * Interface for read status data with counts
 */
interface ReadStatusData {
  key: 'all' | 'read' | 'unread'
  label: string
  count: number
}

/**
 * Calculate story counts for different filter criteria
 */
function calculateFilterCounts(stories: Story[]) {
  // Read status counts
  const readCount = stories.filter(story => story.is_read).length
  const unreadCount = stories.filter(story => !story.is_read).length
  
  // Category counts
  const categoryMap = new Map<string, number>()
  stories.forEach(story => {
    if (story.category && story.category.trim()) {
      const category = story.category.trim()
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    }
  })
  
  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
  
  return {
    readStatusCounts: [
      { key: 'all' as const, label: 'All Stories', count: stories.length },
      { key: 'unread' as const, label: 'Unread', count: unreadCount },
      { key: 'read' as const, label: 'Read', count: readCount }
    ],
    categories
  }
}

/**
 * Application sidebar component
 */
export function Sidebar() {
  const store = useAppStore()
  const { 
    smartViews, 
    activeSmartView, 
    applySmartView, 
    filters,
    setFilters,
    stories,
    filteredStories,
    loadStories
  } = store

  const [supabaseCategories, setSupabaseCategories] = useState<string[]>([])



  // Calculate filter counts based on the full stories array
  const { readStatusCounts, categories } = useMemo(() => {
    return calculateFilterCounts(stories)
  }, [stories])

  // Load additional categories from Supabase to ensure we have all possible categories
  useEffect(() => {
    const loadSupabaseCategories = async () => {
      try {
        const { supabaseService, createSupabaseServiceInstance } = await import('@/lib/supabase')
        
        let service = supabaseService
        if (!service) {
          service = await createSupabaseServiceInstance()
        }
        
        if (service) {
          const result = await service.getAvailableCategories()
          if (!result.error && result.categories.length > 0) {
            setSupabaseCategories(result.categories)
          }
        }
      } catch (error) {
        console.error('Error loading categories from Supabase:', error)
      }
    }
    
    loadSupabaseCategories()
  }, [])

  // Merge categories from stories and Supabase, ensuring all categories are available
  const availableCategories = useMemo(() => {
    const mergedCategories = new Map<string, number>()
    
    // Add categories from current stories with their counts
    categories.forEach(({ name, count }) => {
      mergedCategories.set(name, count)
    })
    
    // Add categories from Supabase that might not be in current stories (with 0 count)
    supabaseCategories.forEach(category => {
      if (!mergedCategories.has(category)) {
        mergedCategories.set(category, 0)
      }
    })
    
    // Convert to array and sort
    return Array.from(mergedCategories.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [categories, supabaseCategories])

  const handleSmartViewClick = (view: SmartView) => {
    applySmartView(view)
  }

  const getViewIcon = (viewId: string) => {
    switch (viewId) {
      case 'todays-digest':
        return <CalendarDaysIcon className="w-4 h-4" />
      case 'quick-reads':
        return <ClockIcon className="w-4 h-4" />
      case 'deep-dives':
        return <SparklesIcon className="w-4 h-4" />
      case 'bookmarks':
        return <BookmarkIcon className="w-4 h-4" />
      case 'highlights':
        return <PencilIcon className="w-4 h-4" />
      case 'flashcards':
        return <AcademicCapIcon className="w-4 h-4" />
      default:
        return <StarIcon className="w-4 h-4" />
    }
  }

  const handleReadStatusFilter = (status: 'all' | 'read' | 'unread') => {
    // Clear active smart view when manual filters are applied
    setFilters({ readStatus: status })
    // Also clear active smart view to show manual filter state
    useAppStore.setState({ activeSmartView: null })
  }

  const handleImportanceFilter = (importanceMin: number) => {
    // Clear active smart view when manual filters are applied  
    setFilters({ importanceMin })
    // Also clear active smart view to show manual filter state
    useAppStore.setState({ activeSmartView: null })
  }

  const handleCategoryFilter = (category: string) => {
    // Clear active smart view when manual filters are applied
    const newCategories = category === 'all' ? [] : [category]
    setFilters({ categories: newCategories })
    // Also clear active smart view to show manual filter state
    useAppStore.setState({ activeSmartView: null })
  }

  // Calculate importance filter story counts
  const importanceFilterCounts = useMemo(() => {
    const counts = []
    for (let i = 0; i <= 10; i++) {
      const count = stories.filter(story => (story.importance_score || 0) >= i).length
      counts.push({ value: i, count })
    }
    return counts
  }, [stories])

  const currentImportanceCount = importanceFilterCounts.find(
    item => item.value === filters.importanceMin
  )?.count || 0

  return (
    <aside className="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4">
        {/* Smart Views Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-3">
                Smart Views
          </h2>
          <div className="space-y-1">
            {smartViews.map((view) => (
              <button
                key={view.id}
                onClick={() => handleSmartViewClick(view)}
                className={clsx(
                  'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  activeSmartView === view.id
                    ? 'bg-accent-light text-white'
                    : 'text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {getViewIcon(view.id)}
                <span className="flex-1 text-left">{view.name}</span>
                {view.storyCount !== undefined && (
                  <span className="text-xs opacity-75">
                    {view.storyCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-3 flex items-center">
            <FunnelIcon className="w-3 h-3 mr-1" />
            Filters
          </h2>
          
          {/* Read Status Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Read Status
            </h3>
            <div className="space-y-1">
              {readStatusCounts.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => handleReadStatusFilter(key)}
                  className={clsx(
                    'w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center justify-between',
                    filters.readStatus === key
                      ? 'bg-gray-200 dark:bg-gray-600 text-text-primary-light dark:text-text-primary-dark'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span>{label}</span>
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-4">
            <h3 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2 flex items-center">
              <TagIcon className="w-3 h-3 mr-1" />
              Category
            </h3>
            <div className="space-y-1">
              {/* All Categories Option */}
              <button
                onClick={() => handleCategoryFilter('all')}
                className={clsx(
                  'w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center justify-between',
                  filters.categories.length === 0
                    ? 'bg-gray-200 dark:bg-gray-600 text-text-primary-light dark:text-text-primary-dark'
                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <span>All Categories</span>
                <span className="text-xs opacity-75">({stories.length})</span>
              </button>
              
              {/* Individual Category Options */}
              {availableCategories.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => handleCategoryFilter(name)}
                  className={clsx(
                    'w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center justify-between',
                    filters.categories.includes(name)
                      ? 'bg-gray-200 dark:bg-gray-600 text-text-primary-light dark:text-text-primary-dark'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span>{name}</span>
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              ))}
              
              {/* Show message if no categories available */}
              {availableCategories.length === 0 && (
                <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark italic px-2 py-1">
                  No categories available
                </div>
              )}
            </div>
          </div>

          {/* Importance Filter */}
          <div className="mt-4">
            <h3 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2 flex items-center justify-between">
              <span>Importance</span>
              <span className="text-xs opacity-75">({currentImportanceCount})</span>
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="10"
                value={filters.importanceMin}
                onChange={(e) => handleImportanceFilter(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark w-6">
                {filters.importanceMin}+
              </span>
            </div>
          </div>
        </div>

        {/* Reading Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-2">
            Today's Reading
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Stories</span>
              <span className="text-text-primary-light dark:text-text-primary-dark font-medium">0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">Time</span>
              <span className="text-text-primary-light dark:text-text-primary-dark font-medium">0 min</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
} 