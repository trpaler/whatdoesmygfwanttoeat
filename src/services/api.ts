import type { FoodPreferences, Recommendation, RecommendationResponse } from '../types';
import { logger } from './logger';
import { trackRecommendationsRequested, trackRecommendationsReceived, trackRecommendationsFailed } from './analytics';
import { generateRecommendations, generateIntroMessage } from '../utils/recommendationGenerator';
import { compilePreferences, formatCompiledForPrompt, estimateTokens } from '../utils/preferenceCompiler';

// Configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || '';
const USE_AI = import.meta.env.VITE_USE_AI === 'true' && !!API_KEY;

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
 * Call Claude API for AI-powered recommendations
 */
async function callClaudeAPI(preferences: FoodPreferences): Promise<RecommendationResponse> {
  const startTime = performance.now();
  
  // Compile preferences to reduce token usage
  const compiled = compilePreferences(preferences);
  const compiledText = formatCompiledForPrompt(compiled);
  const estimatedTokens = estimateTokens(compiledText);
  
  logger.info('ai_api_call_started', {
    endpoint: CLAUDE_API_URL,
    rawDataSize: {
      preferences: preferences.preferences.length,
      restaurants: preferences.restaurants.length,
      dislikes: preferences.dislikes.length,
    },
    compiledStats: compiled.stats,
    estimatedPromptTokens: estimatedTokens,
  });

  const prompt = `You are a helpful food recommendation assistant. Based on the following food preferences, generate 10-12 diverse food suggestions. Items with "(Nx)" indicate frequency - higher frequency means stronger preference.

${compiledText}

Generate suggestions as JSON:
{"recommendations":[{"name":"string","type":"restaurant"|"cuisine"|"dish","reason":"string (humorous, brief)","tags":["string"],"confidence":"high"|"medium"|"low"}],"message":"string (fun intro)"}`;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const duration = performance.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('ai_api_call_failed', {
      endpoint: CLAUDE_API_URL,
      duration,
      status: response.status,
      statusText: response.statusText,
    }, new Error(`HTTP ${response.status}: ${errorText}`));
    throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  // Parse the JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.error('ai_api_parse_failed', {
      endpoint: CLAUDE_API_URL,
      duration,
      rawContent: content.substring(0, 500),
    }, new Error('Failed to parse API response'));
    throw new Error('Failed to parse API response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Add IDs to recommendations
  parsed.recommendations = parsed.recommendations.map((rec: Omit<Recommendation, 'id'>, idx: number) => ({
    ...rec,
    id: `rec-${Date.now()}-${idx}`,
  }));

  logger.info('ai_api_call_completed', {
    endpoint: CLAUDE_API_URL,
    duration,
    status: response.status,
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
        logger.info('attempting_ai_recommendations', { apiKeyPresent: !!API_KEY });
        result = await callClaudeAPI(preferences);
        usedAI = true;
      } catch (aiError) {
        // Log the AI failure and fall back to local
        logger.warn('ai_fallback_triggered', {
          reason: aiError instanceof Error ? aiError.message : 'Unknown AI error',
        }, aiError instanceof Error ? aiError : undefined);
        
        // Fall back to local generation
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        result = generateLocalRecommendations(preferences);
        result.message = "AI was unavailable, but here's what we found based on her preferences:";
      }
    } else {
      // Use local generation directly
      logger.info('using_local_recommendations', { 
        reason: !API_KEY ? 'No API key' : 'AI disabled via VITE_USE_AI',
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
