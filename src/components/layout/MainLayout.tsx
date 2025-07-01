/**
 * Main Layout Component
 * Provides the overall app layout with sidebar, header, and main content area
 */

import React from 'react'
import { useAppStore } from '@/stores/appStore'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Main layout wrapper component
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarVisible, currentView } = useAppStore()

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      {sidebarVisible && currentView === 'feed' && (
        <div className="sidebar-width flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
} 