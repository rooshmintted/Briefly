/**
 * Main App Component for Briefly Desktop
 * Handles routing, theme management, and overall application layout
 */

import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { MainLayout } from '@/components/layout/MainLayout'
import { StoryFeed } from '@/components/stories/StoryFeed'
import { ReadingView } from '@/components/reading/ReadingView'
import { SearchView } from '@/components/search/SearchView'
import { SettingsView } from '@/components/settings/SettingsView'
import { HighlightsFeed } from '@/components/highlights/HighlightsFeed'
import { useTheme } from '@/hooks/useTheme'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useSyncManager } from '@/hooks/useSyncManager'

/**
 * Main application component
 */
function App() {
  const { currentView, selectedStoryId, selectedHighlightId, settings } = useAppStore()
  
  // Custom hooks for app functionality
  useTheme(settings.reading.theme)
  useOnlineStatus()
  useSyncManager()

  // Initialize app on mount
  useEffect(() => {
    console.log('[App] Component mounted, loading initial stories')
    // Load initial stories
    useAppStore.getState().loadStories()

    // Set up keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close reading view
      if (event.key === 'Escape' && currentView === 'reading') {
        useAppStore.getState().selectStory(null)
      }
      
      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        useAppStore.getState().setCurrentView('search')
      }
      
      // Cmd/Ctrl + , for settings
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault()
        useAppStore.getState().setCurrentView('settings')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentView])

  // Handle Electron IPC events
  useEffect(() => {
    if (window.electronAPI) {
      // Handle sync trigger from menu
      window.electronAPI.onSync(() => {
        // Trigger sync action
        console.log('Sync triggered from menu')
      })

      // Handle preferences from menu
      window.electronAPI.onOpenPreferences(() => {
        useAppStore.getState().setCurrentView('settings')
      })

      return () => {
        window.electronAPI.removeAllListeners('trigger-sync')
        window.electronAPI.removeAllListeners('open-preferences')
      }
    }
  }, [])

  /**
   * Render the current view based on app state
   */
  const renderCurrentView = () => {
    switch (currentView) {
      case 'reading':
        return selectedStoryId ? (
          <ReadingView 
            storyId={selectedStoryId}
            highlightId={selectedHighlightId || undefined}
            onMarkAsRead={(id: string) => useAppStore.getState().markStoryAsRead(id, true)}
            onBookmark={(id: string) => useAppStore.getState().toggleStoryBookmark(id)}
            onNavigate={(direction: 'prev' | 'next') => {
              // Implement navigation between stories
              console.log('Navigate:', direction)
            }}
            onClose={() => useAppStore.getState().selectStory(null)}
          />
        ) : null

      case 'search':
        return <SearchView />

      case 'settings':
        return <SettingsView />

      case 'feed':
      default:
        return <StoryFeed />
    }
  }

  return (
    <div className="app-container">
      <MainLayout>
        {renderCurrentView()}
      </MainLayout>
    </div>
  )
}

export default App 