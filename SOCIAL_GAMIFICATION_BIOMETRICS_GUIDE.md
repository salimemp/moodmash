](#social-gamification-biometrics-implementation-guide)
# Social, Gamification & Biometrics Implementation Guide
**MoodMash - Advanced Features Suite**

**Date:** December 27, 2025  
**Version:** 1.0.0  
**Status:** 🚧 IN PROGRESS

---

## 🎯 Overview

This document covers the implementation of three major feature sets that enhance MoodMash's capabilities and user engagement:

1. **Social Support Network** - Connect, message, and share with friends
2. **Gamification & Streaks** - Achievements, points, levels, and rewards
3. **Biometric Integration** - Fitness trackers and health data sync
4. **Voice Emotion Analysis** - AI-powered voice analysis with Gemini

---

## ✅ Implementation Progress

### Database Schema ✅ COMPLETE
**Migration:** `0019_social_gamification_biometrics.sql`

**Tables Created:**
- ✅ `user_connections` - Friend connections
- ✅ `direct_messages` - Private messaging
- ✅ `support_groups` - Community groups
- ✅ `group_members` - Group membership
- ✅ `group_messages` - Group chat
- ✅ `shared_moods` - Opt-in mood sharing
- ✅ `user_streaks` - Daily streaks tracking
- ✅ `achievements` - Achievement definitions
- ✅ `user_achievements` - Unlocked achievements
- ✅ `user_points` - XP and leveling system
- ✅ `points_history` - Points audit log
- ✅ `rewards` - Badges and unlockables
- ✅ `user_rewards` - Earned rewards
- ✅ `biometric_sources` - Connected devices
- ✅ `biometric_data` - Health data points
- ✅ `sleep_data` - Detailed sleep tracking
- ✅ `activity_data` - Workout tracking
- ✅ `biometric_mood_correlations` - AI insights
- ✅ `voice_analysis_sessions` - Voice emotion analysis
- ✅ `voice_emotion_trends` - Emotion patterns over time

**Total: 22 new tables**

---

### Backend API Endpoints ✅ COMPLETE

#### Voice Emotion Analysis
```
✅ POST   /api/voice-journal/:id/analyze  - Analyze voice entry with Gemini AI
✅ GET    /api/voice-journal/:id/analysis - Get voice emotion analysis
```

#### Social Support Network
```
✅ GET    /api/social/connections          - List user connections
✅ POST   /api/social/connections          - Send connection request
✅ PUT    /api/social/connections/:id      - Accept/reject request
✅ POST   /api/social/messages             - Send direct message
✅ GET    /api/social/messages/:userId     - Get conversation messages
```

#### Gamification & Streaks
```
✅ GET    /api/gamification/streaks        - Get user streaks
✅ GET    /api/gamification/achievements   - Get achievements
✅ GET    /api/gamification/points         - Get points and level
```

**Helper Functions:**
- ✅ `updateStreak()` - Update user streaks
- ✅ `checkStreakAchievements()` - Award milestone achievements
- ✅ `awardPoints()` - Award XP and handle level-ups

#### Biometric Integration
```
✅ POST   /api/biometrics/connect          - Connect fitness tracker
✅ GET    /api/biometrics/sources          - List connected devices
✅ POST   /api/biometrics/sync             - Sync health data
✅ GET    /api/biometrics/data             - Get biometric data
```

**Total: 14 API endpoints + 3 helper functions**

---

### Frontend Pages 🚧 IN PROGRESS

**Created:**
- ✅ `public/static/social-network.js` - Social network interface (12 KB)

**Pending:**
- ⏳ `public/static/gamification.js` - Achievements and streaks dashboard
- ⏳ `public/static/biometrics.js` - Health data dashboard
- ⏳ `public/static/leaderboard.js` - Social leaderboard
- ⏳ Page routes in `src/index.tsx`

---

## 📚 Feature Specifications

### 1. Social Support Network 🤝

#### Core Features:
- **Friend Connections**: Send/accept connection requests
- **Direct Messaging**: Private 1-on-1 chat
- **Support Groups**: Create and join communities
- **Mood Sharing**: Opt-in sharing with connections
- **Connection Types**: Friend, Supporter, Therapist, Family

#### Privacy Controls:
- Users control who can connect
- Messages are end-to-end secured
- Mood sharing is optional
- Block/report functionality

#### Use Cases:
- Build accountability partnerships
- Family check-ins
- Therapist communication
- Support group discussions

---

### 2. Gamification & Streaks 🏆

#### Streak System:
**Tracked Activities:**
- `daily_log` - Daily mood logging
- `activity` - Wellness activities
- `voice_journal` - Voice recordings
- `meditation` - Mindfulness practice

**Streak Milestones:**
- 7 days - Week Warrior
- 30 days - Month Master
- 100 days - Centurion
- 365 days - Year Champion

#### Points & Leveling:
**Point Types:**
- `xp` - Experience points (general)
- `wellness_coins` - Activity rewards
- `social_karma` - Helping others

**Earning Points:**
- Daily log: 10 XP
- Activity completion: 25 XP
- Achievement unlock: Variable
- Helping others: 50 XP
- Streak milestone: 100+ XP

**Level Progression:**
- Level 1: 0-100 XP
- Level 2: 100-200 XP (100 more)
- Level 3: 200-300 XP (100 more)
- Formula: Next level = Current Level × 100

#### Achievement Categories:
1. **Streak Achievements** - Consistency rewards
2. **Social Achievements** - Network building
3. **Wellness Achievements** - Activity milestones
4. **AR Achievements** - AR feature usage
5. **Voice Achievements** - Voice journal milestones

#### Rewards:
**Reward Types:**
- `badge` - Profile badges
- `avatar_item` - Avatar customization
- `theme` - UI themes
- `feature_unlock` - Premium features

**Acquisition Methods:**
- Earned through achievements
- Purchased with points
- Gifted by friends

---

### 3. Biometric Integration 📊

#### Supported Platforms:
1. **Fitbit**
   - Heart rate, steps, sleep, calories
   - OAuth 2.0 integration
   - Real-time sync via webhooks

2. **Apple Health**
   - HealthKit data export
   - Heart rate, activity, sleep
   - Privacy-focused data handling

3. **Samsung Health**
   - Steps, heart rate, sleep
   - REST API integration
   - Periodic sync

4. **Google Fit**
   - Activity tracking
   - Heart rate, steps
   - OAuth 2.0 integration

5. **Garmin Connect**
   - Advanced fitness metrics
   - HRV, stress, sleep
   - API integration

#### Data Types Tracked:
- **Heart Rate**: BPM trends
- **Steps**: Daily activity level
- **Sleep**: Duration and quality
- **Activity**: Workouts and calories
- **HRV**: Heart rate variability (stress indicator)
- **SpO2**: Blood oxygen levels
- **Calories**: Energy expenditure

#### Mood-Biometric Correlations:
**AI-Powered Insights:**
- Sleep quality vs mood score
- Exercise impact on anxiety
- Heart rate patterns and stress
- Activity level and energy
- HRV and emotional stability

**Correlation Score:**
- -1.0: Strong negative correlation
- 0.0: No correlation
- +1.0: Strong positive correlation

**Sample Insights:**
- "Your mood improves by 15% on days with 8+ hours sleep"
- "Exercise reduces anxiety by 25% on average"
- "Low HRV correlates with increased stress (0.7 correlation)"

---

### 4. Voice Emotion Analysis 🎤

#### Gemini AI Integration:

**Analysis Dimensions:**
1. **Emotional Content**
   - Primary emotion detection
   - Confidence scores per emotion
   - Emotional intensity
   
2. **Voice Characteristics**
   - Average pitch (Hz)
   - Pitch variance (stress indicator)
   - Speaking rate (WPM)
   - Pause patterns
   
3. **Sentiment Analysis**
   - Overall sentiment (-1.0 to +1.0)
   - Sentiment magnitude (intensity)
   
4. **Content Analysis**
   - Word count
   - Sentence structure
   - Keywords extraction
   - Topic identification
   
5. **Mental Health Indicators**
   - Stress level (low/medium/high)
   - Energy level (low/medium/high)
   - Cognitive clarity (low/medium/high)
   
6. **AI Recommendations**
   - Personalized wellness tips
   - Activity suggestions
   - Professional help indicators

**Analysis Workflow:**
1. User records voice journal
2. Browser transcribes with Web Speech API
3. Audio uploaded to R2 storage
4. User triggers analysis
5. Gemini AI analyzes transcription
6. Results stored in database
7. Trends calculated over time
8. Recommendations displayed

**Privacy:**
- Audio stored securely in R2
- Analysis performed server-side
- User can delete anytime
- No third-party sharing

---

## 🔌 API Integration Guides

### Fitbit Integration

**OAuth 2.0 Flow:**
```javascript
// Step 1: Redirect to Fitbit authorization
const authUrl = `https://www.fitbit.com/oauth2/authorize?
  client_id=${FITBIT_CLIENT_ID}&
  response_type=code&
  scope=heartrate activity sleep&
  redirect_uri=${REDIRECT_URI}`;

// Step 2: Exchange code for tokens
const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(CLIENT_ID + ':' + CLIENT_SECRET)}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: `code=${code}&grant_type=authorization_code&redirect_uri=${REDIRECT_URI}`
});

// Step 3: Save tokens to database
await fetch('/api/biometrics/connect', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${session_token}` },
  body: JSON.stringify({
    source_type: 'fitbit',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000)
  })
});

// Step 4: Fetch Fitbit data
const fitbitData = await fetch('https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

// Step 5: Sync to MoodMash
await fetch('/api/biometrics/sync', {
  method: 'POST',
  body: JSON.stringify({
    source_id: fitbit_source_id,
    data_type: 'heart_rate',
    value: heartRate,
    unit: 'bpm',
    recorded_at: timestamp
  })
});
```

### Apple Health Integration

**HealthKit Export:**
```swift
// iOS App: Export HealthKit data
let healthStore = HKHealthStore()
let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!

let query = HKSampleQuery(sampleType: heartRateType, predicate: nil, limit: 100, sortDescriptors: nil) { query, samples, error in
  guard let samples = samples as? [HKQuantitySample] else { return }
  
  for sample in samples {
    let heartRate = sample.quantity.doubleValue(for: HKUnit(from: "count/min"))
    
    // Send to MoodMash
    sendToMoodMash(
      dataType: "heart_rate",
      value: heartRate,
      recordedAt: sample.startDate
    )
  }
}

healthStore.execute(query)
```

**Web Export (CSV):**
```javascript
// User exports Health data as CSV
// Parse and upload to MoodMash
const parseHealthCSV = (csv) => {
  const lines = csv.split('\n');
  const data = lines.slice(1).map(line => {
    const [date, type, value, unit] = line.split(',');
    return { date, type, value: parseFloat(value), unit };
  });
  
  // Batch upload
  for (const point of data) {
    await fetch('/api/biometrics/sync', {
      method: 'POST',
      body: JSON.stringify({
        source_id: apple_health_source_id,
        data_type: point.type,
        value: point.value,
        unit: point.unit,
        recorded_at: point.date
      })
    });
  }
};
```

### Samsung Health Integration

**REST API:**
```javascript
// OAuth 2.0 flow similar to Fitbit
// Fetch Samsung Health data
const samsungData = await fetch('https://api.samsunghealth.com/v1/data', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dataType: 'com.samsung.health.heart_rate',
    startTime: startDate,
    endTime: endDate
  })
});

// Sync to MoodMash
const { data } = await samsungData.json();
for (const point of data) {
  await fetch('/api/biometrics/sync', {
    method: 'POST',
    body: JSON.stringify({
      source_id: samsung_source_id,
      data_type: 'heart_rate',
      value: point.heartRate,
      unit: 'bpm',
      recorded_at: point.timestamp
    })
  });
}
```

---

## 🎨 Frontend Implementation

### Social Network Page

**Features:**
- Tabbed interface (Connections, Requests, Messages, Find)
- Real-time messaging
- Connection management
- User search

**Key Components:**
```javascript
class SocialNetwork {
  - loadConnections()     // Fetch user connections
  - renderConnections()   // Display connections list
  - openChat(userId)      // Open messaging thread
  - sendMessage()         // Send message
  - loadMessages(userId)  // Load conversation
  - renderMessages()      // Display messages
}
```

### Gamification Dashboard (TODO)

**Features:**
- Streak calendar visualization
- Achievement showcase
- Points and level display
- Leaderboard rankings
- Reward shop

**Components:**
```javascript
class GamificationDashboard {
  - loadStreaks()         // Fetch current streaks
  - renderStreakCalendar() // Visual streak display
  - loadAchievements()    // Fetch unlocked achievements
  - renderAchievements()  // Achievement cards
  - loadLeaderboard()     // Top users
  - renderRewards()       // Available rewards
}
```

### Biometrics Dashboard (TODO)

**Features:**
- Connected devices list
- Health data charts
- Mood-biometric correlations
- Sync status
- Device connection wizard

**Components:**
```javascript
class BiometricsDashboard {
  - loadSources()         // Connected devices
  - renderSourceCards()   // Device cards
  - loadBiometricData()   // Health data
  - renderCharts()        // Data visualization
  - loadCorrelations()    // AI insights
  - connectDevice(type)   // OAuth flow
}
```

---

## 🔒 Privacy & Security

### Data Protection:
- ✅ All biometric data encrypted at rest
- ✅ User-scoped API access
- ✅ OAuth 2.0 for third-party integrations
- ✅ Tokens refreshed automatically
- ✅ Users can disconnect devices anytime
- ✅ Data deletion on account removal

### CCPA Compliance:
- ✅ Right to access biometric data
- ✅ Right to delete all health data
- ✅ Right to export in portable format
- ✅ Opt-out of data sharing
- ✅ Clear privacy disclosures

---

## 📊 Success Metrics

### Engagement Metrics:
- Daily active users with streaks
- Messages sent per day
- Connections made per user
- Achievement unlock rate
- Points earned distribution

### Health Metrics:
- Biometric sources connected
- Data points synced per day
- Mood-health correlations discovered
- User-reported improvements

### Retention Metrics:
- 7-day streak retention
- 30-day streak retention
- Social network effect on retention
- Gamification impact on DAU

---

## 🚀 Deployment Checklist

### Database:
- ✅ Migration created (0019)
- ⏳ Migration applied locally
- ⏳ Migration applied to production
- ⏳ Sample achievements seeded
- ⏳ Default rewards created

### Backend:
- ✅ API endpoints implemented
- ✅ Helper functions created
- ⏳ TypeScript compile check
- ⏳ Unit tests written
- ⏳ Integration tests

### Frontend:
- ✅ Social network page created
- ⏳ Gamification dashboard
- ⏳ Biometrics dashboard
- ⏳ Page routes added
- ⏳ Navigation updated

### Integration:
- ⏳ Fitbit OAuth configured
- ⏳ Apple Health export guide
- ⏳ Samsung Health API keys
- ⏳ Webhook endpoints
- ⏳ Error handling

### Documentation:
- ✅ This guide created
- ⏳ API documentation
- ⏳ User guides
- ⏳ Integration tutorials

---

## 🎯 Next Steps

### Immediate (This Session):
1. ✅ Create database migration
2. ✅ Implement API endpoints
3. ✅ Create social network page
4. ⏳ Create gamification dashboard
5. ⏳ Create biometrics dashboard
6. ⏳ Add page routes
7. ⏳ Test and deploy

### Short-term (Week 1):
1. Seed sample achievements
2. Create rewards shop
3. Implement leaderboards
4. Add Fitbit integration
5. Test with real users

### Long-term (Month 1):
1. Add Apple Health support
2. Implement Samsung Health
3. Build social groups feature
4. Create mood sharing UI
5. Launch gamification beta

---

## 📞 Support & Resources

### Documentation:
- API Reference: In-code JSDoc comments
- User Guide: Coming soon
- Integration Guides: This document

### External APIs:
- **Fitbit**: https://dev.fitbit.com
- **Apple Health**: https://developer.apple.com/healthkit
- **Samsung Health**: https://developer.samsung.com/health
- **Google Fit**: https://developers.google.com/fit
- **Gemini AI**: https://ai.google.dev

---

**Document Status:** 🚧 IN PROGRESS  
**Last Updated:** December 27, 2025  
**Version:** 1.0.0  
**Author:** MoodMash Development Team
