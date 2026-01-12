import { sendToGA } from './ga';

// Log severity levels
export const LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

// Structure for error details
export interface ErrorDetails {
  message: string;
  stack?: string;
  name: string;
}

// Structure for a single log entry
export interface LogEntry {
  timestamp: string;
  sessionId: string;
  level: LogLevelType;
  event: string;
  data: Record<string, unknown>;
  error: ErrorDetails | null;
  userAgent: string;
  url: string;
  sessionDuration: number;
}

// Summary structure for exports
export interface LogSummary {
  totalEvents: number;
  errors: number;
  warnings: number;
  sessionDuration: number;
  userAgent: string;
  startTime: string;
  timeline: Array<{ time: string; event: string; level: LogLevelType }>;
}

// Export structure
export interface LogExport {
  sessionId: string;
  exportedAt: string;
  summary: LogSummary;
  logs: LogEntry[];
  userJourney: Array<{ time: string; event: string }>;
}

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get device/browser info
function getDeviceInfo(): Record<string, string> {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os, userAgent: ua };
}

const MAX_LOGS = 500;
const STORAGE_KEY = 'app_logs';
const SESSION_KEY = 'app_session';

class Logger {
  private logs: LogEntry[] = [];
  private sessionId: string;
  private startTime: number;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Try to restore session or create new one
    const storedSession = this.getStoredSession();
    
    if (storedSession && Date.now() - storedSession.startTime < 30 * 60 * 1000) {
      // Resume session if less than 30 minutes old
      this.sessionId = storedSession.sessionId;
      this.startTime = storedSession.startTime;
      this.logs = this.loadPersistedLogs();
    } else {
      // New session
      this.sessionId = generateSessionId();
      this.startTime = Date.now();
      this.saveSession();
    }

    // Log app loaded event
    this.log(LogLevel.INFO, 'app_loaded', {
      ...getDeviceInfo(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      language: navigator.language,
      online: navigator.onLine,
    });
  }

  private getStoredSession(): { sessionId: string; startTime: number } | null {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveSession(): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        sessionId: this.sessionId,
        startTime: this.startTime,
      }));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  private loadPersistedLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only load logs from current session
        return parsed.filter((log: LogEntry) => log.sessionId === this.sessionId);
      }
    } catch (e) {
      console.warn('Failed to load persisted logs:', e);
    }
    return [];
  }

  private persist(): void {
    try {
      // Keep only the last MAX_LOGS entries
      const toStore = this.logs.slice(-MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to persist logs:', e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Subscribe to log updates
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Main logging method
  log(
    level: LogLevelType,
    event: string,
    data: Record<string, unknown> = {},
    error: Error | null = null
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level,
      event,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : null,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionDuration: Date.now() - this.startTime,
    };

    this.logs.push(entry);

    // Console output
    const consoleMethod = level === 'fatal' ? 'error' : level;
    if (level === 'error' || level === 'fatal') {
      console[consoleMethod](`[${level.toUpperCase()}] ${event}`, data, error);
    } else if (import.meta.env.DEV) {
      console[consoleMethod](`[${level.toUpperCase()}] ${event}`, data);
    }

    // Send to Google Analytics
    sendToGA(event, data, level);

    this.persist();
    this.notifyListeners();
  }

  // Convenience methods
  info(event: string, data: Record<string, unknown> = {}): void {
    this.log(LogLevel.INFO, event, data);
  }

  warn(event: string, data: Record<string, unknown> = {}, error?: Error): void {
    this.log(LogLevel.WARN, event, data, error || null);
  }

  error(event: string, data: Record<string, unknown> = {}, error?: Error): void {
    this.log(LogLevel.ERROR, event, data, error || null);
  }

  fatal(event: string, data: Record<string, unknown> = {}, error?: Error): void {
    this.log(LogLevel.FATAL, event, data, error || null);
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs filtered by level
  getLogsByLevel(level: LogLevelType): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Get session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Generate summary
  generateSummary(): LogSummary {
    return {
      totalEvents: this.logs.length,
      errors: this.logs.filter(l => l.level === 'error' || l.level === 'fatal').length,
      warnings: this.logs.filter(l => l.level === 'warn').length,
      sessionDuration: Date.now() - this.startTime,
      userAgent: navigator.userAgent,
      startTime: new Date(this.startTime).toISOString(),
      timeline: this.logs.map(l => ({
        time: l.timestamp,
        event: l.event,
        level: l.level,
      })),
    };
  }

  // Export logs for AI analysis
  exportLogs(): LogExport {
    return {
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      summary: this.generateSummary(),
      logs: this.logs,
      userJourney: this.logs.map(l => ({
        time: new Date(l.timestamp).toLocaleTimeString(),
        event: l.event,
      })),
    };
  }

  // Download logs as JSON file
  downloadLogs(): void {
    const exportData = this.exportLogs();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.info('logs_exported', { logCount: this.logs.length });
  }

  // Clear logs
  clearLogs(): void {
    const count = this.logs.length;
    this.logs = [];
    localStorage.removeItem(STORAGE_KEY);
    this.info('logs_cleared', { previousCount: count });
    this.notifyListeners();
  }

  // Get storage usage
  getStorageUsage(): { used: number; max: number } {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || '';
      return {
        used: new Blob([stored]).size,
        max: 5 * 1024 * 1024, // 5MB typical localStorage limit
      };
    } catch {
      return { used: 0, max: 5 * 1024 * 1024 };
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Export types for consumers
export type { Logger };
