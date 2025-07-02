/**
 * Flashcards List Component
 * Displays all flashcards for a story with edit/delete actions
 */

import React, { useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  TagIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { Flashcard } from '@/types'
import { formatTimeAgo } from '@/lib/dateUtils'

interface FlashcardsListProps {
  flashcards: Flashcard[]
  onEdit: (flashcard: Flashcard) => void
  onDelete: (flashcardId: string) => void
}

interface FlashcardItemProps {
  flashcard: Flashcard
  onEdit: (flashcard: Flashcard) => void
  onDelete: (flashcardId: string) => void
}

/**
 * Individual flashcard item component with flip functionality
 */
function FlashcardItem({ flashcard, onEdit, onDelete }: FlashcardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    onDelete(flashcard.id)
    setShowDeleteConfirm(false)
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Flashcard Content */}
      <div className="p-4">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFlip}
              className="flex items-center space-x-1 text-sm text-accent-light dark:text-accent-dark hover:underline"
            >
              {isFlipped ? (
                <>
                  <EyeSlashIcon className="w-4 h-4" />
                  <span>Show Front</span>
                </>
              ) : (
                <>
                  <EyeIcon className="w-4 h-4" />
                  <span>Show Back</span>
                </>
              )}
            </button>
            
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatTimeAgo(flashcard.created_at)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(flashcard)}
              className="p-1.5 text-text-secondary-light dark:text-text-secondary-dark hover:text-accent-light dark:hover:text-accent-dark transition-colors"
              aria-label="Edit flashcard"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label="Delete flashcard"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Flashcard Content */}
        <div className="min-h-[120px]">
          {!isFlipped ? (
            <div>
              <h4 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                Front:
              </h4>
              <p className="text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap">
                {flashcard.front}
              </p>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                Back:
              </h4>
              <p className="text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap">
                {flashcard.back}
              </p>
            </div>
          )}
        </div>

        {/* Context */}
        {flashcard.context_text && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h5 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Context:
            </h5>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark italic">
              "{flashcard.context_text}"
            </p>
          </div>
        )}

        {/* Tags */}
        {flashcard.tags && flashcard.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {flashcard.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark"
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Flashcards list component
 */
export function FlashcardsList({ flashcards, onEdit, onDelete }: FlashcardsListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-text-secondary-light dark:text-text-secondary-dark mb-2">
          📚 No flashcards yet
        </div>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Create your first flashcard to start studying!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
          Flashcards ({flashcards.length})
        </h3>
      </div>
      
      <div className="space-y-3">
        {flashcards.map((flashcard) => (
          <FlashcardItem
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
} 