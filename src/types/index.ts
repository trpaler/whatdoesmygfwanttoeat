// Food preferences parsed from user uploads
export interface FoodPreferences {
  preferences: string[];
  restaurants: string[];
  dislikes: string[];
  moodTags: string[];
  rawText?: string; // For PDF or unstructured data
}

// A single food recommendation
export interface Recommendation {
  id: string;
  name: string;
  type: 'restaurant' | 'cuisine' | 'dish';
  reason: string;
  tags: string[];
  confidence: 'high' | 'medium' | 'low';
}

// API response from recommendation service
export interface RecommendationResponse {
  recommendations: Recommendation[];
  message: string;
}

// App state
export type AppState = 'home' | 'upload' | 'loading' | 'recommendations' | 'error' | 'faq';

// File upload result
export interface ParseResult {
  success: boolean;
  data?: FoodPreferences;
  error?: string;
}
