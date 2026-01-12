/**
 * Google Analytics 4 Integration
 * 
 * This module provides GA4 tracking that integrates with our existing logger.
 * Events are sent to both our local logger and Google Analytics.
 */

// GA4 Measurement ID from environment
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Check if GA is enabled
export const isGAEnabled = !!GA_MEASUREMENT_ID;

// Declare gtag on window
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Initialize Google Analytics
 * Call this once when the app loads
 */
export function initGA(): void {
  if (!isGAEnabled) {
    console.log('[GA] Google Analytics disabled - no measurement ID');
    return;
  }

  // Add gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    // Disable automatic page view tracking (we'll do it manually)
    send_page_view: false,
  });

  console.log('[GA] Google Analytics initialized:', GA_MEASUREMENT_ID);
}

/**
 * Track a page view
 */
export function trackPageView(pageName: string, pagePath?: string): void {
  if (!isGAEnabled || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_title: pageName,
    page_location: window.location.href,
    page_path: pagePath || window.location.pathname,
  });
}

/**
 * Track a custom event
 * This maps our logger events to GA4 events
 */
export function trackGAEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isGAEnabled || !window.gtag) return;

  // Sanitize params - GA4 has limits on parameter values
  const sanitizedParams: Record<string, unknown> = {};
  
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      // GA4 parameter names must be <= 40 chars
      const sanitizedKey = key.slice(0, 40);
      
      // GA4 string values must be <= 100 chars
      if (typeof value === 'string') {
        sanitizedParams[sanitizedKey] = value.slice(0, 100);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitizedParams[sanitizedKey] = value;
      } else if (value !== null && value !== undefined) {
        // Convert objects to JSON string (truncated)
        sanitizedParams[sanitizedKey] = JSON.stringify(value).slice(0, 100);
      }
    }
  }

  window.gtag('event', eventName, sanitizedParams);
}

/**
 * Map our logger events to GA4 event names
 * Some events are renamed for better GA4 reporting
 */
const EVENT_NAME_MAP: Record<string, string> = {
  // Navigation
  'app_loaded': 'app_start',
  'navigation': 'screen_view',
  
  // File operations
  'upload_started': 'file_upload_start',
  'upload_completed': 'file_upload_complete',
  'upload_failed': 'file_upload_error',
  'text_input_submitted': 'text_input',
  
  // Recommendations
  'recommendations_requested': 'generate_recommendations',
  'recommendations_received': 'recommendations_ready',
  'recommendations_failed': 'recommendations_error',
  'recommendation_swiped': 'swipe_action',
  
  // User actions
  'button_click': 'select_content',
  'try_again_clicked': 'retry_action',
  'session_complete': 'session_end',
  'user_chose_food': 'skip_to_results',
  
  // Feedback
  'feedback_email_clicked': 'feedback_intent',
  
  // Errors
  'error_occurred': 'exception',
  'react_crash': 'app_crash',
};

/**
 * Send an event to GA4 using our logger event format
 * This is called from the logger to forward events to GA
 */
export function sendToGA(
  event: string,
  data: Record<string, unknown>,
  level: string
): void {
  if (!isGAEnabled) return;

  // Map event name or use original
  const gaEventName = EVENT_NAME_MAP[event] || event;

  // Add level as a parameter for error tracking
  const params: Record<string, unknown> = {
    ...data,
    event_level: level,
  };

  // For errors, add special handling
  if (level === 'error' || level === 'fatal') {
    params.fatal = level === 'fatal';
  }

  trackGAEvent(gaEventName, params);
}
