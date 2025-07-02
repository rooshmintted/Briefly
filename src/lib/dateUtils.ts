/**
 * Date Utilities
 * Handles date formatting and parsing with error handling for timestamp issues
 */

import { formatDistanceToNow } from 'date-fns'

/**
 * Safely formats a timestamp string into a human-readable "time ago" format
 * Handles PostgreSQL timestamp format: "2025-07-02 15:55:57.139381+00"
 */
export function formatTimeAgo(timestamp: string): string {
  try {
    // Handle null, undefined, or empty timestamps
    if (!timestamp || timestamp.trim() === '') {
      console.warn('[formatTimeAgo] Empty or null timestamp provided')
      return 'Unknown time'
    }

    let cleanTimestamp = String(timestamp).trim()
    
    // Handle PostgreSQL timestamp format: "2025-07-02 15:55:57.139381+00"
    // Convert to ISO format that JavaScript can parse
    if (cleanTimestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
      // PostgreSQL format detected - convert to ISO format
      cleanTimestamp = cleanTimestamp.replace(' ', 'T')
      
      // Handle timezone offset: "+00" -> "+00:00", "-05" -> "-05:00"  
      if (cleanTimestamp.match(/[+-]\d{2}$/)) {
        cleanTimestamp = cleanTimestamp + ':00'
      }
      
      // If no timezone info, assume UTC
      if (!cleanTimestamp.match(/[+-]\d{2}:\d{2}$/) && !cleanTimestamp.endsWith('Z')) {
        cleanTimestamp = cleanTimestamp + 'Z'
      }
    }

    const date = new Date(cleanTimestamp)
    
    // Validate the parsed date
    if (isNaN(date.getTime())) {
      console.warn('[formatTimeAgo] Invalid date parsed from timestamp:', {
        original: timestamp,
        cleaned: cleanTimestamp,
        parsed: date
      })
      return 'Unknown time'
    }

    // Check if date is in the future (which might indicate parsing issues)
    const now = new Date()
    if (date.getTime() > now.getTime() + (24 * 60 * 60 * 1000)) { // More than 24 hours in future
      console.warn('[formatTimeAgo] Date appears to be far in the future:', {
        timestamp,
        parsed: date,
        now
      })
    }

    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('[formatTimeAgo] Error formatting timestamp:', error, {
      timestamp,
      type: typeof timestamp
    })
    return 'Unknown time'
  }
}

/**
 * Validates if a timestamp string represents a valid date
 */
export function isValidTimestamp(timestamp: string): boolean {
  try {
    if (!timestamp || timestamp.trim() === '') {
      return false
    }
    
    const date = new Date(timestamp)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}

/**
 * Safely parses a timestamp string into a Date object
 * Handles PostgreSQL timestamp format: "2025-07-02 15:55:57.139381+00"
 */
export function parseTimestamp(timestamp: string): Date | null {
  try {
    if (!timestamp || timestamp.trim() === '') {
      return null
    }

    let cleanTimestamp = String(timestamp).trim()
    
    // Handle PostgreSQL timestamp format: "2025-07-02 15:55:57.139381+00"
    // Convert to ISO format that JavaScript can parse
    if (cleanTimestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
      // PostgreSQL format detected - convert to ISO format
      cleanTimestamp = cleanTimestamp.replace(' ', 'T')
      
      // Handle timezone offset: "+00" -> "+00:00", "-05" -> "-05:00"  
      if (cleanTimestamp.match(/[+-]\d{2}$/)) {
        cleanTimestamp = cleanTimestamp + ':00'
      }
      
      // If no timezone info, assume UTC
      if (!cleanTimestamp.match(/[+-]\d{2}:\d{2}$/) && !cleanTimestamp.endsWith('Z')) {
        cleanTimestamp = cleanTimestamp + 'Z'
      }
    }

    const date = new Date(cleanTimestamp)
    
    if (isNaN(date.getTime())) {
      return null
    }

    return date
  } catch {
    return null
  }
} 