import type { FoodPreferences, Recommendation } from '../types';

interface WeightedItem {
  name: string;
  weight: number;
  type: 'restaurant' | 'cuisine' | 'dish';
}

// Humorous reasons templates
const RESTAURANT_REASONS = [
  "She's been here {count} times. At this point, the staff probably knows her order.",
  "With {count} visits, this place is basically her second home.",
  "Ordered from here {count} times - clearly a favorite!",
  "{count} orders can't be wrong. This is a safe bet.",
  "She keeps coming back ({count}x). Must be doing something right.",
  "A {count}-time repeat customer. The odds are in your favor.",
];

const CUISINE_REASONS = [
  "She's into {name} food - mentioned it {count} times in her preferences.",
  "{name} appears {count} times. She definitely has a thing for it.",
  "With {count} mentions of {name}, this is a solid choice.",
  "{name} ({count}x) - a recurring theme in her food preferences.",
  "She clearly loves {name} cuisine based on {count} data points.",
];

const DISH_REASONS = [
  "This has come up {count} times. She knows what she likes.",
  "{count} mentions of this dish. It's a winner.",
  "Appears {count} times in her preferences - pretty telling!",
  "She's mentioned this {count} times. Take the hint!",
];

const LOW_CONFIDENCE_REASONS = [
  "Only mentioned once, but hey, variety is the spice of life.",
  "A wild card pick! She mentioned it, so there's hope.",
  "Not her usual go-to, but worth a shot.",
  "Throwing this in for some variety. Fingers crossed!",
  "A less frequent choice, but sometimes you gotta take risks.",
];

const FALLBACK_REASONS = [
  "Based on her general preferences, this could work.",
  "Matches her vibe based on the data.",
  "The algorithm thinks she might like this.",
  "A calculated suggestion based on her taste profile.",
];

/**
 * Count frequency of items (case-insensitive)
 */
function countItems(items: string[]): Map<string, { original: string; count: number }> {
  const counts = new Map<string, { original: string; count: number }>();
  
  for (const item of items) {
    const normalized = item.toLowerCase().trim();
    if (!normalized) continue;
    
    const existing = counts.get(normalized);
    if (existing) {
      existing.count++;
    } else {
      counts.set(normalized, { original: item, count: 1 });
    }
  }
  
  return counts;
}

/**
 * Pick a random item from an array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Format a reason string with placeholders
 */
function formatReason(template: string, name: string, count: number): string {
  return template
    .replace('{name}', name)
    .replace('{count}', count.toString());
}

/**
 * Determine confidence based on frequency relative to total
 */
function getConfidence(count: number, maxCount: number): 'high' | 'medium' | 'low' {
  const ratio = count / maxCount;
  if (ratio >= 0.3 || count >= 10) return 'high';
  if (ratio >= 0.1 || count >= 3) return 'medium';
  return 'low';
}

/**
 * Generate tags based on item name (simple keyword extraction)
 */
function generateTags(name: string, type: string): string[] {
  const tags: string[] = [type];
  
  // Common cuisine keywords
  const cuisineKeywords = [
    'italian', 'thai', 'chinese', 'japanese', 'mexican', 'indian', 
    'korean', 'vietnamese', 'greek', 'mediterranean', 'american',
    'french', 'spanish', 'middle eastern', 'asian', 'latin'
  ];
  
  // Common food type keywords
  const foodKeywords = [
    'pizza', 'sushi', 'ramen', 'burger', 'taco', 'pasta', 'salad',
    'sandwich', 'noodles', 'curry', 'steak', 'seafood', 'vegetarian',
    'vegan', 'healthy', 'comfort food', 'fast food', 'brunch', 'breakfast'
  ];
  
  const lowerName = name.toLowerCase();
  
  for (const keyword of [...cuisineKeywords, ...foodKeywords]) {
    if (lowerName.includes(keyword)) {
      tags.push(keyword);
    }
  }
  
  // Limit tags
  return tags.slice(0, 4);
}

/**
 * Weighted random selection - items with higher weight are more likely to be picked
 */
function weightedRandomSelect(items: WeightedItem[], count: number): WeightedItem[] {
  if (items.length === 0) return [];
  
  const selected: WeightedItem[] = [];
  const available = [...items];
  
  while (selected.length < count && available.length > 0) {
    // Calculate total weight
    const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
    
    // Pick a random point in the weight range
    let random = Math.random() * totalWeight;
    
    // Find which item this corresponds to
    let selectedIndex = 0;
    for (let i = 0; i < available.length; i++) {
      random -= available[i].weight;
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }
    
    // Add to selected and remove from available
    selected.push(available[selectedIndex]);
    available.splice(selectedIndex, 1);
  }
  
  return selected;
}

/**
 * Generate recommendations based on weighted random selection from preferences
 */
export function generateRecommendations(
  preferences: FoodPreferences,
  count: number = 10
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const usedNames = new Set<string>();
  
  // Count frequencies
  const restaurantCounts = countItems(preferences.restaurants);
  const preferenceCounts = countItems(preferences.preferences);
  
  // Find max counts for confidence calculation
  const maxRestaurantCount = Math.max(1, ...Array.from(restaurantCounts.values()).map(v => v.count));
  const maxPreferenceCount = Math.max(1, ...Array.from(preferenceCounts.values()).map(v => v.count));
  
  // Build weighted items list
  const weightedItems: WeightedItem[] = [];
  
  // Add restaurants with their frequency as weight
  for (const [, { original, count }] of restaurantCounts) {
    weightedItems.push({
      name: original,
      weight: count,
      type: 'restaurant',
    });
  }
  
  // Add preferences (cuisines/dishes) - classify based on keywords
  for (const [, { original, count }] of preferenceCounts) {
    const lower = original.toLowerCase();
    const isLikelyCuisine = [
      'italian', 'thai', 'chinese', 'japanese', 'mexican', 'indian',
      'korean', 'vietnamese', 'greek', 'mediterranean', 'american',
      'french', 'spanish', 'asian', 'latin', 'food', 'cuisine'
    ].some(kw => lower.includes(kw));
    
    weightedItems.push({
      name: original,
      weight: count,
      type: isLikelyCuisine ? 'cuisine' : 'dish',
    });
  }
  
  // If no data, return empty
  if (weightedItems.length === 0) {
    return [];
  }
  
  // Select items using weighted random
  const targetCount = Math.min(count, weightedItems.length);
  const selected = weightedRandomSelect(weightedItems, targetCount);
  
  // Convert to recommendations
  for (const item of selected) {
    if (usedNames.has(item.name.toLowerCase())) continue;
    usedNames.add(item.name.toLowerCase());
    
    const itemCount = item.weight;
    let reason: string;
    let confidence: 'high' | 'medium' | 'low';
    
    if (item.type === 'restaurant') {
      confidence = getConfidence(itemCount, maxRestaurantCount);
      if (itemCount === 1) {
        reason = pickRandom(LOW_CONFIDENCE_REASONS);
      } else {
        reason = formatReason(pickRandom(RESTAURANT_REASONS), item.name, itemCount);
      }
    } else if (item.type === 'cuisine') {
      confidence = getConfidence(itemCount, maxPreferenceCount);
      if (itemCount === 1) {
        reason = pickRandom(LOW_CONFIDENCE_REASONS);
      } else {
        reason = formatReason(pickRandom(CUISINE_REASONS), item.name, itemCount);
      }
    } else {
      confidence = getConfidence(itemCount, maxPreferenceCount);
      if (itemCount === 1) {
        reason = pickRandom(LOW_CONFIDENCE_REASONS);
      } else {
        reason = formatReason(pickRandom(DISH_REASONS), item.name, itemCount);
      }
    }
    
    recommendations.push({
      id: `rec-${Date.now()}-${recommendations.length}`,
      name: item.name,
      type: item.type,
      reason,
      tags: generateTags(item.name, item.type),
      confidence,
    });
  }
  
  // If we still need more recommendations, add some variety
  if (recommendations.length < count && weightedItems.length > 0) {
    // Add remaining items with lower priority
    const remaining = weightedItems.filter(
      item => !usedNames.has(item.name.toLowerCase())
    );
    
    for (const item of remaining.slice(0, count - recommendations.length)) {
      usedNames.add(item.name.toLowerCase());
      recommendations.push({
        id: `rec-${Date.now()}-${recommendations.length}`,
        name: item.name,
        type: item.type,
        reason: pickRandom(FALLBACK_REASONS),
        tags: generateTags(item.name, item.type),
        confidence: 'low',
      });
    }
  }
  
  // Shuffle the final list so high-frequency items aren't always first
  return recommendations.sort(() => Math.random() - 0.5);
}

/**
 * Generate a fun intro message
 */
export function generateIntroMessage(preferences: FoodPreferences): string {
  const totalRestaurants = preferences.restaurants.length;
  const totalPreferences = preferences.preferences.length;
  const total = totalRestaurants + totalPreferences;
  
  const messages = [
    `Analyzed ${total} data points. Here's what the algorithm thinks:`,
    `Based on ${total} entries, these should work:`,
    `Crunched the numbers from ${total} preferences. Try these:`,
    `${total} data points don't lie. Here are your best bets:`,
    `The data has spoken (${total} entries). Presenting your options:`,
    `After analyzing ${total} food choices, here's what stands out:`,
  ];
  
  if (total < 5) {
    return "Not much data to work with, but here's what we've got:";
  }
  
  return pickRandom(messages);
}
