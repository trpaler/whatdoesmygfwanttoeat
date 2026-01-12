import type { FoodPreferences, Recommendation, RecommendationResponse } from '../types';
import { logger } from './logger';
import { trackRecommendationsRequested, trackRecommendationsReceived, trackRecommendationsFailed } from './analytics';
import { generateRecommendations, generateIntroMessage } from '../utils/recommendationGenerator';
import { compilePreferences, formatCompiledForPrompt, estimateTokens } from '../utils/preferenceCompiler';

// Configuration
// In production, AI calls go through Netlify function (API key is server-side)
// VITE_USE_AI controls whether to attempt AI or go straight to local
const USE_AI = import.meta.env.VITE_USE_AI === 'true';
const API_ENDPOINT = '/.netlify/functions/recommendations';

/**
 * Generate recommendations using weighted random selection based on user preferences.
 * Items that appear more frequently in the data have a higher chance of being recommended.
 */
function generateLocalRecommendations(preferences: FoodPreferences): RecommendationResponse {
  const recommendations = generateRecommendations(preferences, 12);
  const message = generateIntroMessage(preferences);
  
  logger.info('recommendations_generated', {
    method: 'weighted_random',
    inputStats: {
      restaurants: preferences.restaurants.length,
      preferences: preferences.preferences.length,
      dislikes: preferences.dislikes.length,
      moodTags: preferences.moodTags.length,
    },
    outputCount: recommendations.length,
  });
  
  return {
    recommendations,
    message,
  };
}

/**
 * Build the prompt for Claude API
 */
function buildPrompt(preferences: FoodPreferences): string {
  const compiled = compilePreferences(preferences);
  const compiledText = formatCompiledForPrompt(compiled);
  
  return `You are a helpful food recommendation assistant. Based on the following food preferences, generate 10-12 diverse food suggestions. Items with "(Nx)" indicate frequency - higher frequency means stronger preference.

${compiledText}

Generate suggestions as JSON:
{"recommendations":[{"name":"string","type":"restaurant"|"cuisine"|"dish","reason":"string (humorous, brief)","tags":["string"],"confidence":"high"|"medium"|"low"}],"message":"string (fun intro)"}`;
}

/**
 * Call the serverless function for AI-powered recommendations
 * The API key is stored securely on the server, not exposed to the browser
 */
async function callAIFunction(preferences: FoodPreferences): Promise<RecommendationResponse> {
  const startTime = performance.now();
  
  const compiled = compilePreferences(preferences);
  const prompt = buildPrompt(preferences);
  const estimatedTokens_ = estimateTokens(prompt);
  
  logger.info('ai_api_call_started', {
    endpoint: API_ENDPOINT,
    compiledStats: compiled.stats,
    estimatedPromptTokens: estimatedTokens_,
  });

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const duration = performance.now() - startTime;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    
    logger.error('ai_api_call_failed', {
      endpoint: API_ENDPOINT,
      duration,
      status: response.status,
      fallback: errorData.fallback,
    }, new Error(errorData.error || `HTTP ${response.status}`));
    
    // If server indicates fallback, throw to trigger local generation
    if (errorData.fallback) {
      throw new Error('AI_FALLBACK');
    }
    
    throw new Error(errorData.error || `API request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  if (!content) {
    logger.error('ai_api_parse_failed', {
      endpoint: API_ENDPOINT,
      duration,
    }, new Error('No content in response'));
    throw new Error('AI_FALLBACK');
  }
  
  // Parse the JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.error('ai_api_parse_failed', {
      endpoint: API_ENDPOINT,
      duration,
      rawContent: content.substring(0, 500),
    }, new Error('Failed to parse API response'));
    throw new Error('AI_FALLBACK');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Add IDs to recommendations
  parsed.recommendations = parsed.recommendations.map((rec: Omit<Recommendation, 'id'>, idx: number) => ({
    ...rec,
    id: `rec-${Date.now()}-${idx}`,
  }));

  logger.info('ai_api_call_completed', {
    endpoint: API_ENDPOINT,
    duration,
    recommendationCount: parsed.recommendations.length,
  });

  return parsed;
}

/**
 * Get recommendations - tries AI first if enabled, falls back to local generation
 */
export async function getRecommendations(preferences: FoodPreferences): Promise<RecommendationResponse> {
  const startTime = performance.now();
  
  // Track the request
  trackRecommendationsRequested(preferences);
  
  try {
    let result: RecommendationResponse;
    let usedAI = false;
    
    // Try AI if enabled
    if (USE_AI) {
      try {
        logger.info('attempting_ai_recommendations');
        result = await callAIFunction(preferences);
        usedAI = true;
      } catch (aiError) {
        // Log the AI failure and fall back to local
        const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI error';
        
        logger.warn('ai_fallback_triggered', {
          reason: errorMessage,
        }, aiError instanceof Error ? aiError : undefined);
        
        // Fall back to local generation
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        result = generateLocalRecommendations(preferences);
        
        // Only modify message if it wasn't a deliberate fallback
        if (errorMessage !== 'AI_FALLBACK') {
          result.message = "AI was unavailable, but here's what we found based on her preferences:";
        }
      }
    } else {
      // Use local generation directly
      logger.info('using_local_recommendations', { 
        reason: 'AI disabled via VITE_USE_AI',
      });
      
      // Brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
      result = generateLocalRecommendations(preferences);
    }
    
    if (result.recommendations.length === 0) {
      throw new Error('No recommendations could be generated. Please add more food preferences.');
    }
    
    const latency = performance.now() - startTime;
    trackRecommendationsReceived(result.recommendations.length, latency);
    
    logger.info('recommendations_complete', {
      method: usedAI ? 'ai' : 'weighted_random',
      count: result.recommendations.length,
      latency,
    });
    
    return result;
  } catch (error) {
    trackRecommendationsFailed(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Export for checking AI status
export const isAIEnabled = USE_AI;
