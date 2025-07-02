/**
 * Sidebar Component
 * Contains smart views, filters, and navigation for the story feed
 */

import React from 'react'
import { 
  StarIcon,
  ClockIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  FunnelIcon,
  SparklesIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '@/stores/appStore'
import { SmartView } from '@/types'
import { clsx } from 'clsx'

/**
 * Application sidebar component
 */
export function Sidebar() {
  const { 
    smartViews, 
    activeSmartView, 
    applySmartView, 
    filters,
    setFilters
  } = useAppStore()

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
      default:
        return <StarIcon className="w-4 h-4" />
    }
  }

  const handleReadStatusFilter = (status: 'all' | 'read' | 'unread') => {
    // Clear active smart view when manual filters are applied
    useAppStore.getState().setFilters({ readStatus: status })
    if (activeSmartView) {
      useAppStore.setState({ activeSmartView: null })
    }
  }

  const handleImportanceFilter = (importanceMin: number) => {
    // Clear active smart view when manual filters are applied  
    useAppStore.getState().setFilters({ importanceMin })
    if (activeSmartView) {
      useAppStore.setState({ activeSmartView: null })
    }
  }

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
              {[
                { key: 'all', label: 'All Stories' },
                { key: 'unread', label: 'Unread' },
                { key: 'read', label: 'Read' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleReadStatusFilter(key as 'all' | 'read' | 'unread')}
                  className={clsx(
                    'w-full text-left px-2 py-1 rounded text-sm transition-colors',
                    filters.readStatus === key
                      ? 'bg-gray-200 dark:bg-gray-600 text-text-primary-light dark:text-text-primary-dark'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Importance Filter */}
          <div className="mt-4">
            <h3 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Importance
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