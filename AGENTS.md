# agents.md

## Project Overview

A humorous web app that helps users decide where to eat by uploading their food preferences and getting AI-powered suggestions. Built with a tongue-in-cheek approach to the universal "what do you want to eat?" dilemma.

## Agent Workflow

### Plan Mode Agent

**Objective**: Design the architecture and user flow for whatdoesmygfwanttoeat

**Tasks**:

1. Design the component structure for a single-page application
2. Plan the file upload system supporting JSON, CSV, and PDF formats
3. Architect the recommendation engine integration with Claude API
4. Design the swipe/skip UI for browsing suggestions
5. Plan the loading states and transitions between app states
6. Define the data structure for food preferences and recommendations
7. Outline the humorous copy and messaging throughout the app
8. Design analytics and telemetry system
   - Track user interactions (button clicks, file uploads, swipes)
   - Monitor API calls and response times
   - Log user journey through the app states
   - Capture device/browser information for debugging
9. Implement comprehensive error handling and logging
   - Centralized error boundary for React crashes
   - Try-catch blocks around all async operations
   - Structured logging with severity levels (info, warn, error, fatal)
   - Error context capture (user state, previous actions, timestamp)
   - Session replay capability through action logs
10. Build developer dashboard for log inspection
    - Filterable log viewer within the app (dev mode)
    - Export logs as JSON for AI analysis
    - Error aggregation and pattern detection
    - Performance metrics visualization

**Key Decisions**:

- Use React/Typescript. Typescript should be strict. Code should be readable and elegant. Component-based architecture
- Implement client-side file parsing (Papaparse for CSV, native JSON parsing, mammoth for PDF extraction)
- Use Claude API for generating contextual food recommendations
- Design a Tinder-style swipe interface for suggestions
- Store current session state in memory (no persistence needed)
- Mobile-first responsive design

### Build Mode Agent

**Objective**: Implement the complete application based on the plan

**Implementation Requirements**:

#### Core Components

- `HomePage` - Initial CTA button state
- `FileUpload` - Multi-format file input handler
- `LoadingScreen` - Animated loading with rotating funny messages
- `RecommendationCard` - Swipeable card interface for food suggestions
- `ApiService` - Claude API integration for recommendations
- `ErrorBoundary` - React error boundary for crash recovery
- `DevDashboard` - Developer dashboard for log inspection

#### File Processing

- JSON: Direct parse and validate structure
- CSV: Use Papaparse to extract food data
- PDF: Use mammoth to extract text, then parse food items

#### Recommendation Engine

- Send parsed food data to Claude API
- Request 10-15 diverse suggestions based on uploaded preferences
- Generate contextual reasoning for each suggestion
- Handle API errors gracefully with fallback messages

#### UI/UX Features

- Smooth transitions between states (home -> upload -> loading -> recommendations)
- Swipe gestures or button controls (thumbs up/down)
- "Try Again" button to generate new recommendations
- Funny empty states and error messages
- Mobile-responsive layout

#### Technical Stack

- React with hooks for state management
- Tailwind CSS for styling
- Lucide React for icons
- Claude API for recommendations
- No backend required (client-side only)

#### Analytics & Logging System

**Event Tracking**:
- `app_loaded` - Initial page load with device info
- `upload_started` - File type, size
- `upload_completed` - Parse time, record count
- `upload_failed` - Error type, file details
- `recommendations_requested` - Data source
- `recommendations_received` - Count, API latency
- `recommendation_swiped` - Direction (accept/reject), restaurant name
- `try_again_clicked` - How many suggestions rejected
- `error_occurred` - Error type, component, stack trace

**Logging Infrastructure**:
```typescript
// Logger service with structured logs
const LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

class Logger {
  private logs: LogEntry[] = [];
  private sessionId: string;
  private startTime: number;
  
  log(level, event, data, error = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level,
      event,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionDuration: Date.now() - this.startTime
    };
    
    this.logs.push(entry);
    this.persist();
  }
  
  exportLogs() {
    return {
      sessionId: this.sessionId,
      logs: this.logs,
      summary: this.generateSummary()
    };
  }
}
```

**Error Boundaries**:
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logger.log(LogLevel.FATAL, 'react_crash', {
      componentStack: errorInfo.componentStack
    }, error);
  }
}
```

#### Developer Dashboard Component

```typescript
// Dev mode toggle (Ctrl+Shift+D or accessible via ?dev=true)
const DevDashboard = () => {
  const logs = logger.getLogs();
  const [filter, setFilter] = useState('all');
  
  return (
    <div className="fixed inset-0 bg-black/90 text-green-400 p-4 overflow-auto font-mono text-xs">
      <div className="flex justify-between mb-4">
        <h2>Developer Dashboard</h2>
        <button onClick={() => logger.downloadLogs()}>Export Logs</button>
      </div>
      
      <div className="mb-4">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('error')}>Errors</button>
        <button onClick={() => setFilter('info')}>Info</button>
      </div>
      
      {/* Log entries */}
    </div>
  );
};
```

**Export Format for AI Analysis**:
```json
{
  "sessionId": "abc123",
  "exportedAt": "2026-01-12T10:30:00Z",
  "summary": {
    "totalEvents": 45,
    "errors": 2,
    "sessionDuration": 180000,
    "userAgent": "Mozilla/5.0..."
  },
  "logs": [
    {
      "timestamp": "2026-01-12T10:28:00Z",
      "level": "error",
      "event": "api_call_failed",
      "data": {
        "endpoint": "https://api.anthropic.com/v1/messages",
        "context": "generating_recommendations"
      },
      "error": {
        "message": "Network request failed",
        "stack": "Error: Network request failed\n    at..."
      }
    }
  ],
  "userJourney": [
    { "time": "10:27:00", "event": "app_loaded" },
    { "time": "10:27:15", "event": "upload_started" },
    { "time": "10:27:18", "event": "upload_completed" },
    { "time": "10:28:00", "event": "api_call_failed" }
  ]
}
```

#### Storage Strategy
- Use `localStorage` for log persistence (last 500 entries)
- Rotate old logs automatically
- Option to clear logs manually
- Export full session as downloadable JSON
