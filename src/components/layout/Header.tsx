/**
 * Header Component
 * Contains navigation, search, sync status, and app controls
 */

import React from 'react'
import { 
  MagnifyingGlassIcon, 
  Cog6ToothIcon,
  ArrowPathIcon,
  Bars3Icon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '@/stores/appStore'
import { clsx } from 'clsx'

/**
 * Application header component
 */
export function Header() {
  const { 
    currentView, 
    setCurrentView, 
    toggleSidebar,
    isOnline,
    syncStatus,
    sidebarVisible,
    refreshStories,
    isLoading
  } = useAppStore()

  const handleSearchClick = () => {
    setCurrentView('search')
  }

  const handleSettingsClick = () => {
    setCurrentView('settings')
  }

  const handleBackToFeed = () => {
    setCurrentView('feed')
  }

  const handleSyncClick = () => {
    console.log('Refresh stories triggered from header')
    refreshStories()
  }

  return (
    <header className="flex items-center justify-between h-12 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Left Side */}
      <div className="flex items-center space-x-3">
        {/* Sidebar Toggle (only show in feed view) */}
        {currentView === 'feed' && (
          <button
            onClick={toggleSidebar}
            className="btn-ghost p-1"
            aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        )}

        {/* App Title / Navigation */}
        <div className="flex items-center space-x-2">
          {currentView !== 'feed' ? (
            <button
              onClick={handleBackToFeed}
              className="btn-ghost text-sm font-medium"
            >
              ← Briefly
            </button>
          ) : (
            <h1 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
              Briefly
            </h1>
          )}
        </div>
      </div>

      {/* Center - View Title */}
      <div className="flex-1 text-center">
        {currentView === 'reading' && (
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Reading
          </span>
        )}
        {currentView === 'search' && (
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Search
          </span>
        )}
        {currentView === 'settings' && (
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Settings
          </span>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <WifiIcon className="w-4 h-4 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          )}
        </div>

        {/* Refresh Stories Button */}
        <button
          onClick={handleSyncClick}
          disabled={isLoading}
          className={clsx(
            'btn-ghost p-1',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Refresh stories"
          title="Reload stories from Supabase"
        >
          <ArrowPathIcon 
            className={clsx(
              'w-4 h-4',
              isLoading && 'animate-spin',
              'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
            )} 
          />
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearchClick}
          className="btn-ghost p-1"
          aria-label="Search stories"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={handleSettingsClick}
          className="btn-ghost p-1"
          aria-label="Open settings"
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
} 