import Papa from 'papaparse';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import type { FoodPreferences, ParseResult } from '../types';
import {
  trackUploadStarted,
  trackUploadCompleted,
  trackUploadFailed
} from '../services/analytics';
import { logger } from '../services/logger';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Create empty preferences object
function createEmptyPreferences(): FoodPreferences {
  return {
    preferences: [],
    restaurants: [],
    dislikes: [],
    moodTags: []
  };
}

// Parse JSON file
export async function parseJSON(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Normalize the data structure
    const preferences: FoodPreferences = {
      preferences: Array.isArray(data.preferences) ? data.preferences : [],
      restaurants: Array.isArray(data.restaurants) ? data.restaurants : [],
      dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
      moodTags: Array.isArray(data.mood_tags || data.moodTags)
        ? data.mood_tags || data.moodTags
        : []
    };

    // Check if we got any meaningful data
    const hasData = Object.values(preferences).some(arr => arr.length > 0);

    if (!hasData) {
      // Try to extract any string values from the object
      const extractedPrefs = extractStringsFromObject(data);
      if (extractedPrefs.length > 0) {
        preferences.preferences = extractedPrefs;
      } else {
        return {
          success: false,
          error:
            "Couldn't find any food preferences in the JSON file. Make sure it has preferences, restaurants, or dislikes arrays."
        };
      }
    }

    return { success: true, data: preferences };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON: ${
        error instanceof Error ? error.message : 'Invalid format'
      }`
    };
  }
}

// Helper to extract string values from any object
function extractStringsFromObject(obj: unknown): string[] {
  const strings: string[] = [];

  function traverse(item: unknown) {
    if (typeof item === 'string' && item.trim()) {
      strings.push(item.trim());
    } else if (Array.isArray(item)) {
      item.forEach(traverse);
    } else if (typeof item === 'object' && item !== null) {
      Object.values(item).forEach(traverse);
    }
  }

  traverse(obj);
  return strings;
}

// Parse CSV file
export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise(resolve => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        try {
          const preferences = createEmptyPreferences();

          // Process each row
          for (const row of results.data as Record<string, string>[]) {
            const type = (row.type || row.Type || '').toLowerCase().trim();
            const name = row.name || row.Name || row.item || row.Item || '';
            const notes = row.notes || row.Notes || '';

            const value = notes ? `${name} (${notes})` : name;

            if (!value.trim()) continue;

            switch (type) {
              case 'cuisine':
              case 'food':
              case 'preference':
                preferences.preferences.push(value);
                break;
              case 'restaurant':
              case 'place':
                preferences.restaurants.push(value);
                break;
              case 'dislike':
              case 'avoid':
              case 'no':
                preferences.dislikes.push(value);
                break;
              case 'mood':
              case 'tag':
                preferences.moodTags.push(value);
                break;
              default:
                // If no type specified, add to preferences
                preferences.preferences.push(value);
            }
          }

          const hasData = Object.values(preferences).some(
            arr => arr.length > 0
          );

          if (!hasData) {
            resolve({
              success: false,
              error:
                "Couldn't extract food preferences from the CSV. Expected columns: type, name, notes"
            });
            return;
          }

          resolve({ success: true, data: preferences });
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to process CSV: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          });
        }
      },
      error: error => {
        resolve({
          success: false,
          error: `Failed to parse CSV: ${error.message}`
        });
      }
    });
  });
}

// Parse PDF file using pdf.js
export async function parsePDF(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }
    
    const text = fullText.trim();

    if (!text) {
      return {
        success: false,
        error:
          "The PDF appears to be empty or couldn't be read. Try a different file or use text input instead."
      };
    }

    // Create preferences with raw text
    const preferences: FoodPreferences = {
      ...createEmptyPreferences(),
      rawText: text
    };

    // Try to extract structured data from the text
    const lines = text
      .split(/[\n,;]+/)
      .map(l => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (
        lower.includes('dislike') ||
        lower.includes('avoid') ||
        lower.includes('hate') ||
        lower.includes("don't like") ||
        lower.includes('no ')
      ) {
        preferences.dislikes.push(line);
      } else if (
        lower.includes('love') ||
        lower.includes('favorite') ||
        lower.includes('like') ||
        lower.includes('enjoy')
      ) {
        preferences.preferences.push(line);
      } else if (
        lower.includes('restaurant') ||
        lower.includes('cafe') ||
        lower.includes('diner') ||
        lower.includes('bistro')
      ) {
        preferences.restaurants.push(line);
      } else if (line.length > 2 && line.length < 50) {
        // Reasonable length lines might be food items or restaurant names
        preferences.preferences.push(line);
      }
    }

    return { success: true, data: preferences };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse PDF: ${
        error instanceof Error ? error.message : 'Unknown error'
      }. Try using the text input instead.`
    };
  }
}

// Parse DOCX file using mammoth
export async function parseDOCX(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text) {
      return {
        success: false,
        error:
          "The document appears to be empty or couldn't be read. Try a different file."
      };
    }

    // Create preferences with raw text
    const preferences: FoodPreferences = {
      ...createEmptyPreferences(),
      rawText: text
    };

    // Try to extract structured data from the text
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (
        lower.includes('dislike') ||
        lower.includes('avoid') ||
        lower.includes('hate') ||
        lower.includes("don't like")
      ) {
        preferences.dislikes.push(line);
      } else if (
        lower.includes('love') ||
        lower.includes('favorite') ||
        lower.includes('like')
      ) {
        preferences.preferences.push(line);
      } else if (lower.includes('restaurant') || lower.includes('place')) {
        preferences.restaurants.push(line);
      } else if (line.length < 30) {
        preferences.preferences.push(line);
      }
    }

    return { success: true, data: preferences };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse document: ${
        error instanceof Error ? error.message : 'Unknown error'
      }.`
    };
  }
}

// Parse plain text input
export function parseTextInput(text: string): ParseResult {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return {
      success: false,
      error: 'Please enter some food preferences.'
    };
  }

  const preferences = createEmptyPreferences();
  
  // Split by newlines and common delimiters
  const lines = trimmed
    .split(/[\n]+/)
    .map(l => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    
    // Check for section headers
    if (lower.startsWith('restaurants:') || lower.startsWith('places:')) {
      continue; // Skip header
    }
    if (lower.startsWith('dislikes:') || lower.startsWith('avoid:')) {
      continue; // Skip header
    }
    if (lower.startsWith('likes:') || lower.startsWith('favorites:') || lower.startsWith('preferences:')) {
      continue; // Skip header
    }
    if (lower.startsWith('mood:') || lower.startsWith('tags:')) {
      continue; // Skip header
    }

    // Check for prefixed items (e.g., "- Restaurant: Joe's Pizza")
    const restaurantMatch = line.match(/^[-*]?\s*(restaurant|place)s?:\s*(.+)/i);
    if (restaurantMatch) {
      preferences.restaurants.push(restaurantMatch[2].trim());
      continue;
    }

    const dislikeMatch = line.match(/^[-*]?\s*(dislike|avoid|hate|no)s?:\s*(.+)/i);
    if (dislikeMatch) {
      preferences.dislikes.push(dislikeMatch[2].trim());
      continue;
    }

    const moodMatch = line.match(/^[-*]?\s*(mood|tag|vibe)s?:\s*(.+)/i);
    if (moodMatch) {
      preferences.moodTags.push(moodMatch[2].trim());
      continue;
    }

    const likeMatch = line.match(/^[-*]?\s*(like|love|favorite|preference)s?:\s*(.+)/i);
    if (likeMatch) {
      preferences.preferences.push(likeMatch[2].trim());
      continue;
    }

    // Check for inline markers
    if (lower.includes('[restaurant]') || lower.includes('(restaurant)')) {
      preferences.restaurants.push(line.replace(/\[(restaurant)\]|\(restaurant\)/gi, '').trim());
      continue;
    }
    if (lower.includes('[dislike]') || lower.includes('(dislike)') || lower.includes('[avoid]')) {
      preferences.dislikes.push(line.replace(/\[(dislike|avoid)\]|\((dislike|avoid)\)/gi, '').trim());
      continue;
    }

    // Default: add to preferences (most common case)
    // Remove bullet points and dashes
    const cleaned = line.replace(/^[-*•]\s*/, '').trim();
    if (cleaned) {
      preferences.preferences.push(cleaned);
    }
  }

  const hasData = Object.values(preferences).some(arr => arr.length > 0);

  if (!hasData) {
    return {
      success: false,
      error: 'Could not parse any food preferences. Please check the format.'
    };
  }

  return { success: true, data: preferences };
}

// Main parser that routes to the correct parser based on file type with tracking
export async function parseFile(file: File): Promise<ParseResult> {
  const startTime = performance.now();
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Track upload started
  trackUploadStarted(file);

  logger.info('file_processing_started', {
    fileName: file.name,
    fileSize: file.size,
    fileType: extension
  });

  let result: ParseResult;

  try {
    switch (extension) {
      case 'json':
        result = await parseJSON(file);
        break;
      case 'csv':
        result = await parseCSV(file);
        break;
      case 'pdf':
        result = await parsePDF(file);
        break;
      case 'docx':
      case 'doc':
        result = await parseDOCX(file);
        break;
      default:
        result = {
          success: false,
          error: `Unsupported file type: .${extension}. Please upload a JSON, CSV, PDF, or DOCX file.`
        };
    }

    const parseTime = performance.now() - startTime;

    if (result.success && result.data) {
      // Track successful upload
      trackUploadCompleted(file, parseTime, result.data);

      logger.info('file_processing_completed', {
        fileName: file.name,
        parseTime,
        recordCount: {
          preferences: result.data.preferences.length,
          restaurants: result.data.restaurants.length,
          dislikes: result.data.dislikes.length,
          moodTags: result.data.moodTags.length
        }
      });
    } else {
      // Track failed upload
      const error = new Error(result.error || 'Unknown parsing error');
      trackUploadFailed(file, error);

      logger.warn('file_processing_failed', {
        fileName: file.name,
        parseTime,
        errorMessage: result.error
      });
    }

    return result;
  } catch (error) {
    const parseTime = performance.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    trackUploadFailed(file, err);

    logger.error(
      'file_processing_error',
      {
        fileName: file.name,
        parseTime
      },
      err
    );

    return {
      success: false,
      error: `Unexpected error processing file: ${err.message}`
    };
  }
}
