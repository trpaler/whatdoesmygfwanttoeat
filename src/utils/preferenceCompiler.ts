import type { FoodPreferences } from '../types';

interface CompiledPreferences {
  topPreferences: string[];      // Most frequent food preferences
  topRestaurants: string[];      // Most visited restaurants
  dislikes: string[];            // Unique dislikes (no frequency needed)
  moodTags: string[];            // Unique mood tags
  rawTextSummary?: string;       // Truncated raw text if present
  stats: {
    totalPreferenceEntries: number;
    totalRestaurantVisits: number;
    uniquePreferences: number;
    uniqueRestaurants: number;
  };
}

/**
 * Normalizes a string for comparison (lowercase, trim, remove extra spaces)
 */
function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Counts frequency of items, normalizing for comparison but preserving original casing
 */
function countFrequency(items: string[]): Map<string, { original: string; count: number }> {
  const frequencyMap = new Map<string, { original: string; count: number }>();
  
  for (const item of items) {
    const normalized = normalize(item);
    if (!normalized) continue;
    
    const existing = frequencyMap.get(normalized);
    if (existing) {
      existing.count++;
    } else {
      frequencyMap.set(normalized, { original: item, count: 1 });
    }
  }
  
  return frequencyMap;
}

/**
 * Formats items with frequency counts
 * e.g., "Italian (15x)", "Joe's Pizza (8x)", "Thai"
 */
function formatWithFrequency(
  frequencyMap: Map<string, { original: string; count: number }>,
  maxItems: number = 15
): string[] {
  // Sort by frequency (descending), then alphabetically
  const sorted = Array.from(frequencyMap.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.original.localeCompare(b.original);
    })
    .slice(0, maxItems);
  
  return sorted.map(({ original, count }) => {
    if (count > 1) {
      return `${original} (${count}x)`;
    }
    return original;
  });
}

/**
 * Gets unique items (for things like dislikes where frequency doesn't matter)
 */
function getUniqueItems(items: string[], maxItems: number = 20): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const item of items) {
    const normalized = normalize(item);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      unique.push(item);
      if (unique.length >= maxItems) break;
    }
  }
  
  return unique;
}

/**
 * Truncates raw text to a reasonable length for API calls
 */
function truncateRawText(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) return text;
  
  // Try to cut at a sentence boundary
  const truncated = text.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  
  const cutPoint = Math.max(lastSentence, lastNewline);
  if (cutPoint > maxLength * 0.7) {
    return truncated.substring(0, cutPoint + 1) + ' [truncated]';
  }
  
  return truncated + '... [truncated]';
}

/**
 * Compiles raw preferences into a summarized format for efficient API calls
 */
export function compilePreferences(preferences: FoodPreferences): CompiledPreferences {
  const preferenceFreq = countFrequency(preferences.preferences);
  const restaurantFreq = countFrequency(preferences.restaurants);
  
  return {
    topPreferences: formatWithFrequency(preferenceFreq, 15),
    topRestaurants: formatWithFrequency(restaurantFreq, 15),
    dislikes: getUniqueItems(preferences.dislikes, 20),
    moodTags: getUniqueItems(preferences.moodTags, 10),
    rawTextSummary: preferences.rawText ? truncateRawText(preferences.rawText) : undefined,
    stats: {
      totalPreferenceEntries: preferences.preferences.length,
      totalRestaurantVisits: preferences.restaurants.length,
      uniquePreferences: preferenceFreq.size,
      uniqueRestaurants: restaurantFreq.size,
    },
  };
}

/**
 * Formats compiled preferences into a concise string for the API prompt
 */
export function formatCompiledForPrompt(compiled: CompiledPreferences): string {
  const sections: string[] = [];
  
  if (compiled.topPreferences.length > 0) {
    sections.push(`Liked foods/cuisines: ${compiled.topPreferences.join(', ')}`);
  }
  
  if (compiled.topRestaurants.length > 0) {
    sections.push(`Favorite restaurants: ${compiled.topRestaurants.join(', ')}`);
  }
  
  if (compiled.dislikes.length > 0) {
    sections.push(`Dislikes/Avoid: ${compiled.dislikes.join(', ')}`);
  }
  
  if (compiled.moodTags.length > 0) {
    sections.push(`Mood preferences: ${compiled.moodTags.join(', ')}`);
  }
  
  if (compiled.rawTextSummary) {
    sections.push(`Additional notes: ${compiled.rawTextSummary}`);
  }
  
  // Add summary stats if there's significant data
  const { stats } = compiled;
  if (stats.totalPreferenceEntries > 20 || stats.totalRestaurantVisits > 10) {
    sections.push(
      `Data summary: ${stats.totalPreferenceEntries} food entries (${stats.uniquePreferences} unique), ` +
      `${stats.totalRestaurantVisits} restaurant visits (${stats.uniqueRestaurants} unique)`
    );
  }
  
  return sections.join('\n');
}

/**
 * Estimates token count (rough approximation: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
