/**
 * Settings View Component
 * Provides configuration options for reading preferences, sync, and privacy
 */

import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '@/stores/appStore'
import { ReadingPreferences } from '@/types'

/**
 * Settings view component
 */
export function SettingsView() {
  const { 
    settings, 
    updateSettings, 
    updateReadingPreferences,
    setCurrentView 
  } = useAppStore()

  const handleClose = () => {
    setCurrentView('feed')
  }

  const handleReadingPreferenceChange = (key: keyof ReadingPreferences, value: string) => {
    updateReadingPreferences({ [key]: value })
  }

  return (
    <div className="h-full overflow-y-auto bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="sticky top-0 bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
          Settings
        </h1>
        <button
          onClick={handleClose}
          className="btn-ghost p-2"
          aria-label="Close settings"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-8 max-w-2xl">
        {/* Reading Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Reading Preferences
          </h2>
          
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Theme
              </label>
              <select
                value={settings.reading.theme}
                onChange={(e) => handleReadingPreferenceChange('theme', e.target.value as 'light' | 'dark' | 'auto')}
                className="input-field"
              >
                <option value="auto">Auto (System Preference)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Font Size
              </label>
              <div className="flex space-x-4">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleReadingPreferenceChange('fontSize', size)}
                    className={`px-4 py-2 rounded border capitalize ${
                      settings.reading.fontSize === size
                        ? 'bg-accent-light text-white border-accent-light'
                        : 'bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Line Height
              </label>
              <div className="flex space-x-4">
                {['compact', 'normal', 'relaxed'].map((height) => (
                  <button
                    key={height}
                    onClick={() => handleReadingPreferenceChange('lineHeight', height)}
                    className={`px-4 py-2 rounded border capitalize ${
                      settings.reading.lineHeight === height
                        ? 'bg-accent-light text-white border-accent-light'
                        : 'bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {height}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Width */}
            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Content Width
              </label>
              <div className="flex space-x-4">
                {['narrow', 'medium', 'wide'].map((width) => (
                  <button
                    key={width}
                    onClick={() => handleReadingPreferenceChange('contentWidth', width)}
                    className={`px-4 py-2 rounded border capitalize ${
                      settings.reading.contentWidth === width
                        ? 'bg-accent-light text-white border-accent-light'
                        : 'bg-gray-100 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {width}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Notifications
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications.newStoriesEnabled}
                onChange={(e) => updateSettings({
                  notifications: {
                    ...settings.notifications,
                    newStoriesEnabled: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent-light focus:ring-accent-light"
              />
              <span className="text-text-primary-light dark:text-text-primary-dark">
                Notify when new stories arrive
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications.syncCompleteEnabled}
                onChange={(e) => updateSettings({
                  notifications: {
                    ...settings.notifications,
                    syncCompleteEnabled: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent-light focus:ring-accent-light"
              />
              <span className="text-text-primary-light dark:text-text-primary-dark">
                Notify when sync completes
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications.readingRemindersEnabled}
                onChange={(e) => updateSettings({
                  notifications: {
                    ...settings.notifications,
                    readingRemindersEnabled: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent-light focus:ring-accent-light"
              />
              <span className="text-text-primary-light dark:text-text-primary-dark">
                Reading reminders
              </span>
            </label>
          </div>
        </section>

        {/* Sync Settings */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Sync & Storage
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.sync.autoSyncEnabled}
                onChange={(e) => updateSettings({
                  sync: {
                    ...settings.sync,
                    autoSyncEnabled: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent-light focus:ring-accent-light"
              />
              <span className="text-text-primary-light dark:text-text-primary-dark">
                Auto-sync enabled
              </span>
            </label>

            {settings.sync.autoSyncEnabled && (
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Sync Interval
                </label>
                <select
                  value={settings.sync.syncIntervalMinutes}
                  onChange={(e) => updateSettings({
                    sync: {
                      ...settings.sync,
                      syncIntervalMinutes: parseInt(e.target.value)
                    }
                  })}
                  className="input-field"
                >
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Keep offline stories for
              </label>
              <select
                value={settings.sync.offlineStorageDays}
                onChange={(e) => updateSettings({
                  sync: {
                    ...settings.sync,
                    offlineStorageDays: parseInt(e.target.value)
                  }
                })}
                className="input-field"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
              </select>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            Privacy
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.privacy.analyticsEnabled}
                onChange={(e) => updateSettings({
                  privacy: {
                    ...settings.privacy,
                    analyticsEnabled: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent-light focus:ring-accent-light"
              />
              <span className="text-text-primary-light dark:text-text-primary-dark">
                Share anonymous usage analytics
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.privacy.crashReportingEnabled}
                onChange={(e) => updateSettings({
                  privacy: {
                    ...settings.privacy,
                    crashReportingEnabled: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent-light focus:ring-accent-light"
              />
              <span className="text-text-primary-light dark:text-text-primary-dark">
                Send crash reports to help improve the app
              </span>
            </label>
          </div>
        </section>

        {/* App Information */}
        <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
            About
          </h2>
          
          <div className="space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <p>Briefly Desktop v0.1.0</p>
            <p>AI-powered newsletter reading app</p>
            <p>Built with Electron, React, and Supabase</p>
          </div>
        </section>
      </div>
    </div>
  )
} 