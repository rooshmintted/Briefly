/**
 * Sync Manager Hook
 * Handles background synchronization with Supabase and manages sync intervals
 */

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/appStore'

/**
 * Custom hook to manage background sync operations
 */
export function useSyncManager() {
  const { 
    isOnline, 
    settings, 
    updateSyncStatus,
    syncStatus 
  } = useAppStore()
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Perform sync operation
   */
  const performSync = async () => {
    if (!isOnline || syncStatus.is_syncing) {
      return
    }

    updateSyncStatus({ is_syncing: true })
    
    try {
      // TODO: Implement actual sync with database layer
      console.log('Performing sync...')
      
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      updateSyncStatus({
        is_syncing: false,
        last_sync_at: new Date().toISOString(),
        pending_changes: 0,
        last_error: undefined
      })
      
      console.log('Sync completed successfully')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      
      updateSyncStatus({
        is_syncing: false,
        last_error: errorMessage
      })
      
      console.error('Sync failed:', error)
    }
  }

  // Set up auto-sync interval
  useEffect(() => {
    if (settings.sync.autoSyncEnabled && isOnline) {
      const intervalMs = settings.sync.syncIntervalMinutes * 60 * 1000
      
      syncIntervalRef.current = setInterval(() => {
        performSync()
      }, intervalMs)

      // Perform initial sync
      performSync()
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
    }
  }, [settings.sync.autoSyncEnabled, settings.sync.syncIntervalMinutes, isOnline])

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline && settings.sync.autoSyncEnabled) {
      performSync()
    }
  }, [isOnline])

  return {
    performSync,
    isSyncing: syncStatus.is_syncing
  }
} 