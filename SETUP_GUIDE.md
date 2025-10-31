# Setup Guide - Phase 1 & 2 Features

## Quick Start

### 1. Install Dependencies
```bash
npm install react-markdown remark-gfm rehype-highlight
```

### 2. Database Migration
The database tables have already been created via Supabase MCP. Verify in Supabase dashboard:
- fingenie_conversations
- price_alerts
- portfolio_analytics
- notifications
- earnings_calendar
- user_watchlist

### 3. Environment Variables
Ensure these are set in `.env.production`:
```env
VITE_SUPABASE_URL=https://ydakwyplcqoshxcdllah.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Edge Functions Required

#### a) `fingenie-chat-gemini`
Must accept:
```json
{
  "query": "user message",
  "context": "previous conversation context",
  "session_id": "user_session_id"
}
```

#### b) `indian-market-data`
Must accept:
```json
{
  "action": "getBulkPrices",
  "symbols": ["RELIANCE", "TCS", "INFY"]
}
```

Returns:
```json
{
  "prices": {
    "RELIANCE": {
      "price": 2487.50,
      "change": 12.30,
      "changePercent": 0.50,
      "volume": 1234567
    }
  }
}
```

### 5. Test the Features

#### Test Voice Input:
1. Open FinGenie page
2. Click microphone icon
3. Allow microphone permission
4. Speak your question
5. Verify transcript appears

#### Test Conversation Persistence:
1. Send a message in FinGenie
2. Refresh the page
3. Verify conversation history loads

#### Test Real-time Prices:
1. Open Portfolio page
2. Go to Analytics tab
3. Verify prices update every 30 seconds (during market hours)

#### Test Notifications:
1. Click bell icon in header
2. Verify notifications load
3. Test mark as read
4. Test delete

#### Test Earnings Calendar:
1. Go to Portfolio > Earnings tab
2. Verify upcoming earnings load
3. Toggle "My Portfolio" filter

## Troubleshooting

### Voice Input Not Working
- **Issue:** Browser doesn't support Web Speech API
- **Solution:** Use Chrome, Edge, or Safari (not Firefox)

### Conversations Not Saving
- **Issue:** User not authenticated
- **Solution:** Ensure user is logged in via Supabase Auth

### Prices Not Updating
- **Issue:** Edge function not responding
- **Solution:** Check Edge function logs in Supabase dashboard

### Notifications Not Appearing
- **Issue:** Realtime not connected
- **Solution:** Verify Supabase Realtime is enabled in project settings

## Feature Flags

To disable features temporarily:

### Disable Voice Input:
In `FinGeniePage.tsx`, set:
```typescript
const [voiceSupported, setVoiceSupported] = useState(false);
```

### Disable Real-time Prices:
In `PortfolioAnalyticsDashboard.tsx`, comment out:
```typescript
// realtimePriceService.subscribe(...)
```

### Disable Notifications:
In `NotificationBell.tsx`, return early:
```typescript
if (true) return null;
```

## Performance Tips

1. **Price Updates:**
   - Only subscribe when portfolio page is active
   - Unsubscribe when leaving page

2. **Conversation History:**
   - Limit to last 20 conversations
   - Paginate if needed

3. **Notifications:**
   - Limit to last 50 notifications
   - Auto-delete old notifications

## Security Checklist

- [x] RLS enabled on all tables
- [x] User-scoped queries
- [x] No API keys in frontend
- [x] Secure token handling
- [x] Input validation

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Voice Input | ✅ | ❌ | ✅ | ✅ |
| Markdown | ✅ | ✅ | ✅ | ✅ |
| Real-time | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |

## Support

For issues, check:
1. Browser console for errors
2. Supabase Edge Function logs
3. Network tab for API calls
4. Database tables for data

## Next Steps

After testing Phase 1 & 2:
1. Gather user feedback
2. Monitor performance metrics
3. Plan Phase 3 features
4. Optimize based on usage patterns
