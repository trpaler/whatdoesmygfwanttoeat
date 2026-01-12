import { logger } from './logger';
import type { FoodPreferences, Recommendation } from '../types';

/**
 * Analytics service for tracking user interactions and events.
 * All events are logged through the Logger service for persistence and export.
 */

// Track file upload events
export function trackUploadStarted(file: File): void {
  logger.info('upload_started', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || file.name.split('.').pop(),
  });
}

export function trackUploadCompleted(
  file: File,
  parseTime: number,
  preferences: FoodPreferences
): void {
  logger.info('upload_completed', {
    fileName: file.name,
    parseTime,
    recordCount: {
      preferences: preferences.preferences.length,
      restaurants: preferences.restaurants.length,
      dislikes: preferences.dislikes.length,
      moodTags: preferences.moodTags.length,
    },
    hasRawText: !!preferences.rawText,
  });
}

export function trackUploadFailed(file: File, error: Error): void {
  logger.error('upload_failed', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || file.name.split('.').pop(),
  }, error);
}

// Track recommendation events
export function trackRecommendationsRequested(preferences: FoodPreferences): void {
  logger.info('recommendations_requested', {
    hasPreferences: preferences.preferences.length > 0,
    hasRestaurants: preferences.restaurants.length > 0,
    hasDislikes: preferences.dislikes.length > 0,
    hasMoodTags: preferences.moodTags.length > 0,
    hasRawText: !!preferences.rawText,
  });
}

export function trackRecommendationsReceived(
  count: number,
  latency: number
): void {
  logger.info('recommendations_received', {
    count,
    latency,
  });
}

export function trackRecommendationsFailed(error: Error): void {
  logger.error('recommendations_failed', {}, error);
}

// Track swipe events
export function trackRecommendationSwiped(
  recommendation: Recommendation,
  direction: 'accept' | 'reject',
  index: number,
  total: number
): void {
  logger.info('recommendation_swiped', {
    direction,
    name: recommendation.name,
    type: recommendation.type,
    confidence: recommendation.confidence,
    index,
    total,
    progress: `${index + 1}/${total}`,
  });
}

// Track try again
export function trackTryAgainClicked(rejectedCount: number, acceptedCount: number): void {
  logger.info('try_again_clicked', {
    rejectedCount,
    acceptedCount,
    totalViewed: rejectedCount + acceptedCount,
  });
}

// Track navigation events
export function trackNavigation(from: string, to: string): void {
  logger.info('navigation', {
    from,
    to,
  });
}

// Track button clicks
export function trackButtonClick(buttonName: string, context?: Record<string, unknown>): void {
  logger.info('button_click', {
    buttonName,
    ...context,
  });
}

// Track errors
export function trackError(
  errorType: string,
  component: string,
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error('error_occurred', {
    errorType,
    component,
    ...context,
  }, error);
}

// Track React crashes (for ErrorBoundary)
export function trackReactCrash(
  error: Error,
  componentStack: string
): void {
  logger.fatal('react_crash', {
    componentStack,
  }, error);
}

// Track session completion
export function trackSessionComplete(
  totalSwipes: number,
  accepted: number,
  rejected: number
): void {
  logger.info('session_complete', {
    totalSwipes,
    accepted,
    rejected,
    acceptRate: totalSwipes > 0 ? (accepted / totalSwipes * 100).toFixed(1) + '%' : '0%',
  });
}
