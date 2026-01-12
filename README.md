# What Does My GF Want to Eat?

The app that finally answers the question you ask every single day.

## The Problem

- You: "What do you want to eat?"
- Her: "I don't know, anything."
- You: "How about pizza?"
- Her: "No, not that."
- You: *internal screaming*

## The Solution

Upload her food preferences once, get instant suggestions, and save yourself from the "anything" paradox. Built for my girlfriend, but hey, your relationship can benefit too.

## How It Works

1. **Upload the data** - Drop in a JSON, CSV, or PDF with food preferences (restaurants, cuisines, dishes she actually likes)
2. **We do the thinking** - Our AI analyzes the data and suggests something she'll probably accept
3. **Swipe through options** - Like Tinder, but for food. Keep swiping until something sticks.

## Features

- **Multi-format support** - JSON, CSV, or PDF (we're not picky, unlike *someone*)
- **Smart suggestions** - Context-aware recommendations based on uploaded preferences
- **Swipe interface** - Skip suggestions you know will get rejected
- **Humor-infused** - Because if you can't laugh about it, you'll cry
- **Mobile-first** - Make decisions on the go, right before she says "I'm hungry"

## Data Format Examples

**JSON**:
```json
{
  "preferences": ["Italian", "Thai", "Sushi"],
  "restaurants": ["Joe's Pizza", "Pad Thai Palace"],
  "dislikes": ["Anything too spicy", "Seafood on Mondays"],
  "mood_tags": ["comfort food", "healthy", "adventurous"]
}
```

**CSV**:
```
type,name,notes
cuisine,Italian,loves pasta
restaurant,Joe's Pizza,go-to spot
dislike,cilantro,absolutely not
```

**PDF**: Just text descriptions of preferences, favorite spots, and things to avoid.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Claude API (the real MVP)
- Pure client-side (no servers, no databases, no commitment issues)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Configuration

1. Copy `.env.example` to `.env`
2. Add your Claude API key: `VITE_CLAUDE_API_KEY=sk-ant-...`
3. Set `VITE_USE_MOCK=false` to use real API

## Loading Messages

While we figure out what she wants, you'll see gems like:
- "She said 'anything'... interpreting that..."
- "Processing 'I don't know'..."
- "Cross-referencing cravings vs reality..."
- "Consulting the oracle..."
- "Eliminating all 50 places she doesn't want..."

## Analytics & Debugging

Built-in telemetry and error tracking for developers.

### For Developers

- **Comprehensive logging** - Every interaction and error is tracked
- **Dev dashboard** - Press `Ctrl+Shift+D` or add `?dev=true` to URL
- **Export logs** - Download full session trace as JSON
- **AI-friendly format** - Feed logs directly to Claude for debugging help

### What We Track

- User interactions (clicks, swipes, uploads)
- API performance and errors
- File processing metrics
- Session timeline and duration
- Error context and stack traces

### Privacy Note

All analytics stay local in your browser. Nothing is sent to external servers. You control when to export logs.

### Debugging with AI

Got an error? Export your logs and ask Claude:

1. Open dev dashboard (`Ctrl+Shift+D`)
2. Click "Export Logs"
3. Send to Claude with: "Here are my app logs, what went wrong?"
4. Get instant diagnosis and fixes

Example log export:
```json
{
  "sessionId": "session_123",
  "summary": {
    "totalEvents": 42,
    "errors": 1,
    "sessionDuration": 120000
  },
  "logs": [...]
}
```

### Dev Dashboard Features

- **Error filtering** - Quickly find what broke
- **Performance metrics** - See API latency and processing times
- **Event timeline** - Visualize user journey
- **One-click export** - JSON format ready for AI analysis
- **Log management** - Clear old logs, manage storage

## FAQ

**Q: Will this actually solve the problem?**  
A: No guarantees, but it's better than suggesting Chipotle for the 47th time.

**Q: Can I use this for my boyfriend/partner/roommate?**  
A: Absolutely. The struggle is universal.

**Q: What if she says "not that" to every suggestion?**  
A: There's a "Try Again" button. Use it liberally.

**Q: Does this store my data?**  
A: Nope. Everything stays in your session. We respect privacy more than she respects your dinner suggestions.

## Contributing

Found a bug? Have a funnier loading message? PRs welcome.

## License

MIT - Use it, share it, save relationships with it.

---

_Built with love, frustration, and the eternal hope that dinner decisions will someday be easier._
