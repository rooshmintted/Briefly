/**
 * Electron Preload Script
 * Provides secure API bridge between main and renderer processes
 */

import { contextBridge, ipcRenderer } from 'electron'

// Define the API that will be exposed to the renderer process
interface ElectronAPI {
  // Environment variables
  env: {
    SUPABASE_URL: string
    SUPABASE_ANON_KEY: string
    DEV_USER_ID: string
    NODE_ENV: string
  }
  
  // App settings
  getAppSetting: (key: string) => Promise<any>
  setAppSetting: (key: string, value: any) => Promise<boolean>
  
  // External links
  openExternal: (url: string) => Promise<void>
  
  // Window controls
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  refreshApp: () => Promise<void>
  
  // Event listeners
  onSync: (callback: () => void) => void
  onOpenPreferences: (callback: () => void) => void
  
  // Remove listeners
  removeAllListeners: (channel: string) => void
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Environment variables - safely expose from main process
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    DEV_USER_ID: process.env.DEV_USER_ID || 'dev-user',
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  
  // App settings
  getAppSetting: (key: string) => ipcRenderer.invoke('get-app-setting', key),
  setAppSetting: (key: string, value: any) => ipcRenderer.invoke('set-app-setting', key, value),
  
  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  refreshApp: () => ipcRenderer.invoke('refresh-app'),
  
  // Event listeners
  onSync: (callback: () => void) => {
    ipcRenderer.on('trigger-sync', callback)
  },
  onOpenPreferences: (callback: () => void) => {
    ipcRenderer.on('open-preferences', callback)
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// Export the interface to make this file a module
export { ElectronAPI }

// Extend the Window interface to include our API
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
} 