# OM_AI_WEB_ADMIN_PLAN_2026.md

**Version**: 1.0
**Status**: BATCH S2 DETAILED WEB & ADMIN SPECIFICATION
**Scope**: Complete Om AI web app + admin dashboard architecture and feature specification
**Date**: April 4, 2026
**App Name**: Om AI (Web + Admin Portal)
**Team**: Team B (Web Lead: 1-2 engineers, Admin/Backend support: shared with backend team)

---

# 1. WEB APP OVERVIEW

## 1.1 Purpose

The Om AI web app serves two user types:

1. **End Users** (Students, Professionals, Parents)
   - Browse persona library
   - Initiate live calls (WebRTC)
   - View call history and recaps
   - Manage subscription
   - Family dashboard (Phase A2)

2. **Admin Users** (School admins, Business teams, Om AI staff)
   - Manage personas (create, edit, disable)
   - View user analytics
   - Manage teams/organizations
   - Content moderation
   - Usage reports

## 1.2 Success Metrics

| Metric | Target | Notes |
|---|---|---|
| **Web DAU** | 30% of total DAU | By end of June |
| **Call completion rate on web** | > 90% | Same as mobile |
| **Web session length** | 10-15 min | Baseline |
| **Conversion rate on web** | > 5% | Free-to-paid |
| **Web accessibility** | WCAG 2.1 AA | From day 1 |
| **Performance (Lighthouse)** | > 80 | Mobile + Desktop |

---

# 2. USER PERSONAS & JOURNEYS

## 2.1 End User Journeys (MVP Phase A1)

### Journey 1: New User Sign-up → First Call
```
1. Land on marketing page (external)
2. Click "Get Started" → Redirects to app.om.omdala.com/signup
3. Auth via magic link / OAuth (shared core)
4. Onboarding: "Choose your first persona"
   - Show 3 personas (English Teacher, Business Coach, Wellness Companion)
   - Brief description + 30-sec video for each
5. User selects persona
6. Initiate call (WebRTC setup)
   - Audio permission request
   - Call UI (avatar, transcript, controls)
7. Call ends after 30 min (free tier) or user taps "End Call"
8. Recap shown (transcript + summary)
9. Prompt to subscribe or save recap

Journey time: 5-15 min
```

### Journey 2: Browse Personas & Subscribe
```
1. User logs in
2. Navbar → "Personas" or "Browse"
3. Grid/list view of all personas (3 in MVP)
4. Click persona → Detail card
   - Avatar, bio, expertise, ratings
   - User reviews
   - "Start call" CTA
5. User subscribes for unlimited
   - "Upgrade to Pro"
   - In-app purchase flow → Stripe
   - Confirmation + receipt
6. Unlimited calls unlocked
```

### Journey 3: Access Call History & Recaps
```
1. User logs in
2. Navbar → "My Calls" or "History"
3. List of past calls (date, duration, persona, summary)
4. Click call → Recap view
   - Full transcript
   - Key topics
   - Suggested next steps
   - Download transcript button (Pro only)
5. Option to save/star recap
   - "Save to library"
   - Tag/label recap
6. Search/filter recaps (by date, persona, topic)
```

## 2.2 Admin User Journeys (Phase A2+)

### Journey 1: Persona Management (Om AI Staff)
```
1. Admin logs in (special auth flag)
2. Navbar → "Admin Dashboard"
3. Sidebar: Personas, Users, Insights, Settings
4. Click "Personas"
5. List of all personas with status (active, draft, disabled)
6. Click persona → Edit form
   - Name, avatar, bio, expertise, speaking style, response speed
   - System prompt (LLM configuration)
   - Availability (24/7, business hours)
   - Disabled/archive persona
7. Create new persona: Form + preview
8. Analytics per persona:
   - Total calls, avg duration, rating, feedback
```

### Journey 2: School/Business Admin (Phase A2-A3)
```
1. School principal logs in (team admin flag)
2. Sidebar: Team Dashboard, Students, Classes, Usage, Billing
3. Click "Students"
   - View enrolled students
   - Progress per student
   - Usage (calls, minutes, retention)
4. Click "Classes"
   - Create class
   - Assign teacher
   - Assign students
5. Click "Usage"
   - Team usage report (minutes, calls, cost)
   - Per-student usage
6. Click "Billing"
   - Current plan, usage, invoices
```

---

# 3. FEATURE SPECIFICATION (PHASE A1)

## 3.1 Homepage / Landing Page

### Layout
```
Header
├── Logo "Om AI"
├── Nav: Personas | My Calls | Account | [Login/Signup CTA]
└── Dark mode toggle

Hero Section
├── Headline: "Learn with AI that feels like a real person"
├── Subheader: "Perfect English. Confident Communication. 1-on-1 lessons."
├── CTA: "Get Started Free" → /signup
└── Hero image/video (AI teacher animation)

Features Section
├── "Learn from real people (AI powered)"
├── "Personalized learning at your pace"
├── "Track your progress"
└── Social proof (user count, ratings)

Personas Preview
├── 3 persona cards (grid)
│  ├── Avatar
│  ├── Name + specialty
│  ├── Rating
│  └── "Start Free Call" CTA
└── "See all personas" → /personas

Pricing Section
├── Free tier: $0 (30 min/day)
├── Pro: $9.99/month (unlimited)
└── FAQs

Footer
├── Links, legal, contact
└── Social links
```

### Pages: `/`, `/login`, `/signup`

These pages are shared with mobile and use the same auth core.

---

## 3.2 Authenticated User Pages

### Page: `/personas` — Persona Library (MVP)

**Route**: `/personas` or `/app/personas`

**Layout**:
```
Sidebar (Desktop) / Hamburger (Mobile)
├── Logo
├── Nav
│  ├── Home / Dashboard
│  ├── Personas (active)
│  ├── My Calls
│  ├── Profile
│  └── Logout
└── Dark mode toggle

Main Content
├── Header: "Meet your learning partners"
├── Search bar (filter by name, specialty)
├── Sort: By rating, by specialty
│
├── Persona Grid (3 columns desktop, 1 mobile)
│  ├── Persona Card (repeat)
│  │  ├── Avatar (circular, 200x200)
│  │  ├── Name "English Teacher"
│  │  ├── Specialty: "English · Conversation · Pronunciation"
│  │  ├── Rating: ⭐ 4.8 (120 reviews)
│  │  ├── Quick stats: "2.5k calls" | "Avg 18 min"
│  │  └── CTA button:
│  │     ├── "Start Call" (mobile + web)
│  │     └── Green button, large tap target
│  │
│  └── (repeat for 3 personas)
│
└── (Phase A2+) "More personas coming soon"
```

**Mobile Responsiveness**:
- Stack cards vertically (1 column)
- Large tap targets (48px minimum)
- Search visible at top

**Interactions**:
- Click persona card → /personas/:personaId (detail view)
- Click "Start Call" → /call/:personaId (initiate call)

---

### Page: `/personas/:personaId` — Persona Detail (MVP)

**Route**: `/personas/english-teacher` (slug-based)

**Layout**:
```
Header
├── Back button
├── Persona avatar (large, 300x300)
└── Share button

Persona Info
├── Name "English Teacher"
├── Specialty & expertise
├── Rating + review count
├── Bio: "I'm a certified English teacher from Cambridge..."
│
├── Key Stats
│  ├── 2.5k calls completed
│  ├── Avg session: 18 minutes
│  ├── Availability: 24/7
│  └── Response time: <1s avg
│
├── Specialties (badges)
│  ├── Conversation Practice
│  ├── Pronunciation Coaching
│  └── Business English
│
├── Reviews Section (top 5)
│  ├── Review card (repeat)
│  │  ├── User avatar + name
│  │  ├── Rating (stars)
│  │  ├── Quote: "Really helpful with my accent!"
│  │  └── Date
│  └── "Load more reviews" button
│
└── CTA Button
   ├── Primary: "Start Free Call" (30 min/day free tier)
   ├── Secondary: "Upgrade to Pro for unlimited"
   └── (if Pro) "Start Call"
```

**Mobile**: Cards stack vertically, avatar centered, full-width CTA button.

---

### Page: `/call/:personaId` — Live Call Interface

**Route**: `/app/call/:personaId` or `/call/:personaId?callId=xyz`

**Layout** (during active call):
```
Header
├── Persona name + avatar (compact)
├── Timer (00:15 elapsed / 30:00 free limit)
└── Minimize/close button

Main Content
├── Persona Avatar (large, centered, animated during speech)
│  ├── Pulsing indicator when listening
│  └── Waveform animation when speaking
│
├── Transcript Area
│  ├── Header: "Transcript"
│  ├── Scrollable message list
│  │  ├── User message (right-aligned, blue)
│  │  │  └── "How do I pronounce 'rhythm'?"
│  │  │
│  │  └── Persona message (left-aligned, gray)
│  │     └── "Great question! It's pronounced RID-um..."
│  │
│  └── Auto-scroll to latest
│
├── Controls (bottom)
│  ├── Microphone toggle (on/off indicator)
│  ├── Speaker toggle
│  ├── Settings (audio quality, transcript)
│  └── End Call button (red, prominent)
│
└── (after call ends)
   └── Show recap section
```

**Desktop Variant** (side-by-side):
```
Left 50%: Persona avatar + transcript
Right 50%: Transcript with larger text + sidebar info
```

**Mobile** (full-width, stacked):
- Persona avatar takes top 40%
- Transcript takes bottom 60%
- Controls fixed at bottom

**WebRTC Integration**:
- Use Cloudflare Durable Objects or Twilio for SFU
- Audio codec: Opus (VP8 video if added later)
- Fallback: Check browser support, show error if WebRTC not available

**Transcript Sync**:
- Real-time transcript updates via WebSocket
- User speaks → auto-caption within 1-2 seconds
- Persona responses appear as typing indicator, then full message

---

### Page: `/calls` — Call History / "My Calls"

**Route**: `/app/calls` or `/my-calls`

**Layout**:
```
Header
├── Title: "My Calls"
├── Filter dropdown:
│  ├── All personas
│  ├── English Teacher
│  ├── Business Coach
│  └── Wellness Companion
└── Sort: Most recent, Longest, Best rated

Call List
├── Call Card (repeat)
│  ├── Left: Persona avatar (small, 50x50)
│  ├── Middle: Call details
│  │  ├── Persona name "English Teacher"
│  │  ├── Date/time: "Apr 2, 2026 · 2:30 PM"
│  │  ├── Duration: "18 min 32 sec"
│  │  ├── Topics: "Pronunciation, Grammar" (tags)
│  │  └── Summary snippet: "Discussed how to pronounce..."
│  │
│  ├── Right: Rating (5-star or empty if not rated)
│  │
│  └── Click → /calls/:callId → Recap view
│
└── Pagination / Infinite scroll
```

**Recap View** (`/calls/:callId`):
```
Header
├── Back button
├── Persona name + date
└── Share / Download buttons

Content
├── Call Metadata
│  ├── Duration: 18 min 32 sec
│  ├── Date: Apr 2, 2026, 2:30 PM
│  ├── Topics: Pronunciation, Grammar
│  └── Rating: ⭐ 4/5 (user's rating of session)
│
├── Full Transcript
│  ├── Scrollable text
│  ├── User messages (blue)
│  ├── Persona messages (gray)
│  └── Timestamps per line
│
├── Summary & Key Topics
│  ├── "Session summary: Discussed pronunciation..."
│  ├── Key topics (badges):
│  │  ├── Pronunciation
│  │  ├── British vs American accent
│  │  └── Grammar tips
│  │
│  └── "Suggested next steps"
│     ├── "Practice 'th' sounds"
│     ├── "Review past perfect tense"
│     └── Links to resource (future)
│
├── Rate Session
│  ├── Star rating (1-5)
│  ├── Comment (optional)
│  └── Submit button
│
└── Actions
   ├── "Download Transcript" (Pro only)
   ├── "Save to Library" (star icon)
   └── "Start another call"
```

---

### Page: `/account` — Profile & Settings

**Route**: `/app/account` or `/profile` or `/settings`

**Layout**:
```
Sidebar
├── Profile
├── Preferences
├── Billing
├── Notifications
└── Privacy & Security

Profile Section
├── Avatar upload (circular)
├── Display name (text input)
├── Email (read-only, from shared auth)
├── Bio (optional, text area)
├── Date joined
└── Save button

Preferences Section
├── Language: English (dropdown)
├── Theme: Light / Dark / System
├── Notification email frequency:
│  ├── Daily digest
│  ├── Weekly summary
│  └── Never
└── Save button

Billing Section
├── Current plan: Pro / Free
├── Next billing date (if Pro)
├── Usage this month: "12 calls, 3 hours 45 min"
├── Plan change options:
│  ├── "Upgrade to Pro" (if Free)
│  ├── "Manage subscription" (if Pro)
│  └── "Cancel subscription" (if Pro)
└── Payment method on file (masked)

Notifications
├── Call reminders
├── Tips & suggestions
├── News & updates
└── Toggles for each

Privacy & Security
├── Download your data
├── Delete account (warning modal)
└── Session management (logout all devices)
```

**Mobile**: Tabs instead of sidebar navigation.

---

## 3.3 Billing / Subscription Flow

**Route**: `/billing` or `/subscription` or via Account → Billing

**Free Tier**:
- 30 minutes of calls per day
- Access to 3 personas (Phase A1)
- Call history (7 days retention initially)
- Basic transcript (no export)

**Pro Tier** ($9.99/month):
- Unlimited calls
- All personas (current + future)
- Call history (unlimited retention)
- Export transcript (PDF, TXT)
- Priority queue (faster response)
- Ad-free experience

**Upgrade Flow**:
```
1. User clicks "Upgrade to Pro"
2. Modal: Pricing card
   ├── Features list (checkmarks)
   ├── Price: $9.99/month
   ├── "Start free trial" or "Subscribe now" CTA
   └── Link to terms/privacy
3. Click subscribe → Stripe/PayPal checkout
4. (Shared billing backend handles)
5. Success page
   ├── Confirmation message
   ├── "Welcome to Pro!"
   └── "Start unlimited calls"
6. Redirect to /personas or /calls
```

**Subscription Management**:
- View current plan
- Next billing date
- Payment method
- Option to cancel
- Past invoices (download PDF)

---

## 3.4 Shared Authentication Pages

**Routes**: `/login`, `/signup`, `/forgot-password`

These use the shared auth core (magic link / OAuth). The Om AI web app reuses the same auth UI/flow as mobile, with styling adapted for web.

See: `OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md` (Section 2.1 Auth) for API details.

---

# 4. ADMIN DASHBOARD SPECIFICATION (PHASE A2+)

## 4.1 Admin Authentication & Access

**Access Control**:
- Only Om AI staff + authorized admins can access `/admin`
- Check user role via shared auth (role flag: "om-ai-staff", "school-admin", "business-admin")
- Redirect to `/login` if not authenticated
- Redirect to `/app` if user lacks admin role

**Admin Entry Point**: `/admin` or `/dashboard/admin`

---

## 4.2 Admin Dashboard Layout (Om AI Staff)

**Navigation**:
```
Sidebar (persistent on desktop, hamburger on mobile)
├── Logo "Om AI Admin"
├── Search users (global search)
│
├── Main Menu
│  ├── Dashboard (overview)
│  ├── Personas
│  │  ├── Manage personas
│  │  ├── Create new
│  │  └── Analytics per persona
│  │
│  ├── Users
│  │  ├── User directory
│  │  ├── Usage analytics
│  │  ├── Cohorts / segments
│  │  └── Moderation
│  │
│  ├── Organizations (Phase A2+)
│  │  ├── Schools
│  │  ├── Businesses
│  │  └── Manage teams
│  │
│  ├── Analytics & Insights
│  │  ├── Daily/weekly/monthly stats
│  │  ├── Retention cohorts
│  │  ├── Conversion funnels
│  │  ├── LTV / CAC
│  │  └── Persona performance
│  │
│  ├── Content Management
│  │  ├── Marketing pages
│  │  ├── Persona bios
│  │  ├── FAQs
│  │  └── Learning paths (A2+)
│  │
│  ├── Settings
│  │  ├── App configuration
│  │  ├── Feature flags
│  │  ├── API keys
│  │  └── Team members
│  │
│  └── Support
│     ├── User support tickets
│     ├── Error logs
│     ├── System health
│     └── Incident tracking
│
└── User menu
   ├── Profile
   ├── Preferences
   └── Logout
```

---

## 4.3 Dashboard Home (`/admin`)

**Layout**:
```
Page Header
├── Title: "Admin Dashboard"
├── Date range picker (Last 7 days, 30 days, MTD, custom)
└── Refresh button

Key Metrics (top row, 4-column grid)
├── Card 1: Daily Active Users
│  ├── Number: "4,250" (or progress toward 5k target)
│  ├── Trend: +12% vs yesterday
│  └── Sparkline chart
│
├── Card 2: Calls This Period
│  ├── Number: "28,450"
│  ├── Trend: +8% vs previous period
│  └── Sparkline
│
├── Card 3: Free-to-Paid Conversion
│  ├── Percentage: "4.2%"
│  ├── Target: 5%
│  └── Trend: +0.3% vs last period
│
└── Card 4: Active Subscriptions
   ├── Number: "1,150"
   ├── Monthly recurring revenue (MRR): "$11,485"
   └── Trend: +18% vs previous month

Charts Section (two rows)
├── Row 1: DAU Trend (line chart, 30 days)
│  ├── X-axis: Date
│  ├── Y-axis: Users
│  └── Show Free and Pro separately
│
├── Row 1: Calls by Persona (bar chart)
│  ├── Bars: English Teacher, Business Coach, Wellness Companion
│  ├── Metric: Total calls, avg duration, rating
│
├── Row 2: Retention Cohorts (heatmap or table)
│  ├── Rows: Cohort (sign-up week)
│  ├── Columns: Day 1, 7, 14, 30, 60
│  └── Cells: % of cohort retained
│
└── Row 2: Top Issues / System Health
   ├── Error rate (target: <5%)
   ├── API latency (target: <200ms)
   ├── Call success rate (target: >95%)
   └── Uptime (target: 99.9%)

Quick Actions (buttons at bottom)
├── "View user growth details"
├── "Manage personas"
├── "View support tickets"
└── "Check system status"
```

---

## 4.4 Personas Management (`/admin/personas`)

**Layout**:
```
Header
├── Title: "Personas"
├── "Create New Persona" button (primary)
└── Filter: Status (Active, Draft, Disabled)

Personas Table
├── Columns:
│  ├── Avatar (small, 40x40)
│  ├── Name (text)
│  ├── Specialty (text, "English · Conversation")
│  ├── Status (badge: Active/Draft/Disabled)
│  ├── Calls (number)
│  ├── Avg Rating (stars)
│  ├── Actions (edit, delete, analytics)
│
├── Row (repeat per persona)
│  ├── English Teacher | English · Conversation | Active | 2,543 calls | ⭐ 4.8
│  ├── Edit | Analytics | Disable
│  └── Click row → /admin/personas/:personaId
│
└── Pagination

Analytics Popup (click "Analytics")
├── Mini modal showing:
│  ├── Total calls, avg duration
│  ├── User rating distribution
│  ├── Feedback highlights
│  └── Link to full analytics page
```

**Persona Detail / Edit** (`/admin/personas/:personaId`):

```
Form
├── Avatar upload (circular, 200x200)
├── Name (text input)
├── Specialty (multi-select tags)
│  ├── English
│  ├── Conversation
│  ├── Pronunciation
│  └── Custom tags
│
├── Bio (text area)
├── Expertise (text area, markdown)
│
├── LLM Configuration
│  ├── System prompt (large text area, syntax highlighted)
│  ├── Temperature (0-1 slider, default 0.7)
│  ├── Response style (dropdown)
│  │  ├── Formal
│  │  ├── Casual
│  │  ├── Patient
│  │  └── Encouraging
│  │
│  └── Response length (dropdown)
│     ├── Short (1-2 sentences)
│     ├── Medium (3-5 sentences)
│     └── Long (2+ paragraphs)
│
├── Availability
│  ├── 24/7 toggle
│  ├── Operating hours (if not 24/7)
│  └── Timezone
│
├── Status
│  ├── Draft / Active / Disabled (radio buttons)
│  ├── If Disabled: Reason (text, optional)
│
├── Advanced (collapse/expand)
│  ├── Speaking style (dropdown)
│  ├── Response speed (slider, 0.5x - 2x)
│  ├── Accent selection (dropdown for future)
│  └── Custom instructions
│
└── Actions
   ├── Save button (green)
   ├── Cancel button (gray)
   ├── Delete button (red, with confirmation)
   └── Test persona (open call interface with this persona)

Test Persona Panel (side-by-side on desktop, below on mobile)
├── "Test this persona"
├── Mini call interface
├── User can chat for 5 minutes
├── Transcript shown
└── Feedback form
```

**Create New Persona** (`/admin/personas/new`):

Same form as edit, but fields start empty. After save, redirect to detail page.

---

## 4.5 Users Management (`/admin/users`)

**Layout**:
```
Header
├── Title: "Users"
├── Search by name/email
├── Filter:
│  ├── Status: Active, Inactive, Banned
│  ├── Plan: Free, Pro
│  ├── Sign-up date: Last 7 days, 30 days, custom
│  └── Usage: High activity, Low activity, Churned
└── Export users (CSV)

Users Table
├── Columns:
│  ├── Avatar (small)
│  ├── Name
│  ├── Email
│  ├── Status (Active/Inactive/Banned)
│  ├── Plan (Free/Pro)
│  ├── Joined date
│  ├── Last active
│  ├── Total calls
│  ├── This month calls
│  ├── LTV (lifetime value, $)
│  └── Actions (view, ban, contact)
│
├── Row (repeat per user)
│  └── Click row → /admin/users/:userId
│
└── Pagination + infinite scroll option
```

**User Detail** (`/admin/users/:userId`):

```
Left Side: User Profile
├── Avatar (large, 200x200)
├── Name, email
├── Plan: Free / Pro
├── Status: Active / Inactive / Banned
├── Joined: Apr 1, 2026
├── Last active: Apr 3, 2026, 2:30 PM
│
├── Usage Stats
│  ├── Total calls: 45
│  ├── Total minutes: 432
│  ├── Avg session: 9.6 min
│  ├── Favorite persona: English Teacher
│  └── Churn risk: Low
│
├── Subscription
│  ├── Plan: Free (until 30 min/day limit)
│  ├── Signup date: Apr 1
│  ├── Payment method: None
│  └── Actions: [Offer discount] [Upgrade]
│
└── Admin Actions
   ├── Send email to user
   ├── Ban user (confirm)
   ├── Download user data
   └── Delete account (confirm)

Right Side: Call History
├── Title: "Recent Calls"
├── Table:
│  ├── Date | Persona | Duration | Rating
│  ├── Apr 3 | English Teacher | 12:34 | ⭐ 5
│  ├── Apr 2 | Business Coach | 8:15 | ⭐ 4
│  └── ...
└── Link to full call history
```

---

## 4.6 Analytics & Insights (`/admin/analytics`)

**Tab Navigation**:
```
├── Overview (default)
├── Daily Stats
├── Retention
├── Conversion
└── Persona Performance
```

**Overview Tab**:
```
Key Metrics (same as dashboard home)
├── DAU, Calls, Conversion, Subscriptions

Dashboards
├── "Engagement": DAU, session length, frequency
├── "Monetization": MRR, ARPU, LTV
├── "Quality": Call success rate, avg rating, errors
└── "Growth": New sign-ups, sign-up source, viral loops
```

**Daily Stats Tab**:
```
Date range picker + Metrics selector

Chart: Time series (line or bar)
├── DAU (trend)
├── Calls (count)
├── Subscriptions (cumulative)
├── Free-to-paid conversions (daily)
└── MRR (cumulative)

Data export
├── Download as CSV
└── Download as JSON
```

**Retention Tab**:
```
Cohort Analysis Heatmap
├── Rows: Cohort (by sign-up week)
├── Columns: Day 1, 7, 14, 30, 60, 90
├── Cells: % retained (color-coded, green = high)
└── Show D1, D7, D30 target metrics

Retention Curves
├── Line chart by cohort
├── Show trend over time
└── Compare vs benchmarks
```

**Conversion Tab**:
```
Funnel: Sign-up → First call → 5 calls → Subscribe

Visualization
├── Stage names (left)
├── User count at each stage (center)
├── Conversion % to next stage (right)
├── Annotated with action buttons
   ├── "Improve onboarding" (low sign-up → first call)
   ├── "Optimize personas" (low engagement)
   ├── "Test pricing" (low conversion)

Conversion by Source
├── Organic vs Paid
├── By channel
├── Compare conversion rates
```

**Persona Performance Tab**:
```
Persona Comparison Table
├── Columns:
│  ├── Name
│  ├── Total calls
│  ├── Avg duration
│  ├── Avg rating
│  ├── Repeat rate
│  ├── Churn impact

Persona Trends
├── Calls per persona over time
├── Rating trends
├── New user conversion by persona
```

---

## 4.7 Settings (`/admin/settings`)

**Sections**:

### App Configuration
```
├── Site name: "Om AI"
├── Support email
├── Logo / branding
├── Email templates (for transactional emails)
│  ├── Welcome email
│  ├── Call reminder
│  ├── Subscription confirmation
│  └── Custom vars
└── Save button
```

### Feature Flags
```
├── Beta features
├── A/B tests (running experiments)
├── Rate limiting
│  ├── Calls per user per day (free tier)
│  ├── API rate limit
│  └── Login attempts
└── Toggle on/off per feature
```

### API Keys
```
├── Webhook URL (for payment events, etc)
├── API key management
│  ├── Create new key
│  ├── Revoke key
│  └── Rotate key
└── Documentation link
```

### Team Members (Admin access)
```
├── List of team members
│  ├── Name, email, role
│  ├── Add team member (email invite)
│  ├── Change role (Admin, Editor, Viewer)
│  └── Revoke access
└── Audit log of access changes
```

---

# 5. TECHNICAL ARCHITECTURE

## 5.1 Frontend Stack (Web)

**Framework**: React 18 + TypeScript + Next.js (App Router)

**UI Libraries**:
- **Component library**: Tailwind CSS + headless UI (Radix UI)
- **Forms**: React Hook Form + Zod (validation)
- **Tables**: TanStack React Table (for data-heavy pages)
- **Charts**: Recharts or Chart.js (for analytics dashboards)
- **Modals**: Radix UI Dialog
- **Date picker**: React DayPicker or date-fns
- **Rich text editor**: TipTap or ProseMirror (for admin, optional)

**State Management**:
- React Query (server state, API caching)
- Zustand (client state, auth, UI state)
- Context API (theme, user preferences)

**Real-time**:
- WebSocket (for live call transcript updates)
- Use `socket.io` or plain WebSocket with auto-reconnect logic

**Code Structure**:
```
app/
├── (marketing)/          # Public marketing pages
│  ├── page.tsx           # Homepage
│  ├── pricing/page.tsx
│  └── layout.tsx         # Marketing layout (navbar + footer)
│
├── (auth)/               # Auth pages (login, signup, forgot password)
│  ├── login/page.tsx
│  ├── signup/page.tsx
│  └── layout.tsx
│
├── app/                  # App (requires auth)
│  ├── layout.tsx         # App layout (sidebar + navbar)
│  ├── personas/
│  │  ├── page.tsx        # /app/personas
│  │  ├── [slug]/
│  │  │  └── page.tsx     # /app/personas/[slug]
│  │
│  ├── call/
│  │  └── [personaId]/
│  │     └── page.tsx     # /app/call/[personaId]
│  │
│  ├── calls/
│  │  ├── page.tsx        # /app/calls (history)
│  │  └── [callId]/
│  │     └── page.tsx     # /app/calls/[callId] (recap)
│  │
│  ├── account/
│  │  └── page.tsx        # /app/account (profile + settings)
│
├── admin/                # Admin dashboard (requires auth + admin role)
│  ├── layout.tsx         # Admin layout (sidebar)
│  ├── page.tsx           # /admin (dashboard home)
│  ├── personas/
│  │  ├── page.tsx        # /admin/personas
│  │  ├── new/page.tsx    # /admin/personas/new
│  │  ├── [personaId]/
│  │  │  └── page.tsx     # /admin/personas/[personaId]
│  │
│  ├── users/
│  │  ├── page.tsx        # /admin/users
│  │  └── [userId]/
│  │     └── page.tsx     # /admin/users/[userId]
│  │
│  ├── analytics/
│  │  └── page.tsx        # /admin/analytics
│  │
│  └── settings/
│     └── page.tsx        # /admin/settings

components/
├── auth/                 # Auth-related components
│  ├── LoginForm.tsx
│  ├── SignupForm.tsx
│  └── OAuthButton.tsx
│
├── personas/             # Persona library components
│  ├── PersonaCard.tsx
│  ├── PersonaGrid.tsx
│  ├── PersonaDetail.tsx
│  └── PersonaFilter.tsx
│
├── call/                 # Live call components
│  ├── CallInterface.tsx
│  ├── TranscriptPanel.tsx
│  ├── ControlsBar.tsx
│  └── PersonaAvatar.tsx
│
├── recap/                # Recap components
│  ├── RecapView.tsx
│  ├── TranscriptExport.tsx
│  └── RatingForm.tsx
│
├── admin/                # Admin components
│  ├── DashboardMetrics.tsx
│  ├── PersonasTable.tsx
│  ├── UsersTable.tsx
│  ├── AnalyticsCharts.tsx
│  └── PersonaForm.tsx
│
├── common/               # Shared components
│  ├── Navbar.tsx
│  ├── Sidebar.tsx
│  ├── Table.tsx
│  ├── Modal.tsx
│  └── LoadingSpinner.tsx

lib/
├── api.ts                # API client (fetch wrapper)
├── auth.ts               # Auth utilities (token storage, refresh)
├── websocket.ts          # WebSocket client for live updates
├── hooks.ts              # Custom React hooks
├── utils.ts              # Utility functions
└── types.ts              # TypeScript types
```

## 5.2 Backend Integration

The web app integrates with the Om AI backend via API routes:

**Shared Services** (via `/v1/*`):
- Auth: POST `/v1/auth/login`, GET `/v1/auth/session`, POST `/v1/auth/logout`
- Billing: GET/POST `/v1/billing/*`, GET `/v1/billing/usage`
- Notifications: WebSocket for real-time alerts

**App-Specific Services** (via `/v1/live/*` or `/v2/live/*`):
- Personas: GET `/v1/live/personas`
- Calls: POST `/v1/live/call/start`, POST `/v1/live/call/end`
- Recaps: GET `/v1/live/recap/:callId`, POST `/v1/live/recap/save`
- Transcripts: WebSocket `/v2/live/ws` for real-time transcript updates

**Admin Services** (via `/v1/admin/*` or `/v2/admin/*`):
- Persona management: GET/POST/PUT/DELETE `/v2/admin/personas`
- User management: GET `/v2/admin/users`, GET `/v2/admin/users/:userId`
- Analytics: GET `/v2/admin/analytics/*`
- System settings: GET/POST `/v2/admin/settings`

See `OM_AI_MASTER_DEV_PLAN_2026.md` for full API contract details.

---

# 6. DEPLOYMENT & DEVOPS

## 6.1 Frontend Deployment

**Build & Hosting**: Cloudflare Pages

**Process**:
```
1. Push to main branch
2. GitHub Action triggers build
3. Next.js build → static + serverless functions
4. Deploy to Cloudflare Pages
5. Environment variables set per environment (staging, production)
```

**Environments**:
- **Production**: `app.om.omdala.com`
- **Staging**: `staging-app.om.omdala.com`
- **Development**: Local dev server + `dev.om.omdala.com` (optional)

**Environment Variables**:
```
REACT_APP_API_BASE_URL=https://api.om.omdala.com
REACT_APP_ADMIN_API_URL=https://admin-api.om.omdala.com
REACT_APP_WS_URL=wss://ws.om.omdala.com
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
REACT_APP_SEGMENT_WRITE_KEY=...
```

## 6.2 CI/CD Pipeline

**GitHub Actions**:
```yaml
name: Build and Deploy Om AI Web

on:
  push:
    branches: [main, staging]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test:web
      - run: npm run build:web
      - name: Deploy to Cloudflare
        uses: cloudflare/pages-action@v1
        with:
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          apiToken: ${{ secrets.CF_API_TOKEN }}
          projectName: om-ai-web
          directory: dist
          productionBranch: main
```

## 6.3 Monitoring & Observability

**Metrics to track**:
- Page load time (Lighthouse, Web Vitals)
- API error rates
- WebSocket connection stability
- User analytics (page views, conversions)
- Crash reporting (Sentry)

**Tools**:
- **Sentry**: Error tracking + source maps
- **Segment**: Analytics events (flows, conversions)
- **Cloudflare Analytics**: Web traffic, bot metrics
- **LogRocket**: Session replay (optional, for debugging)
- **Google Analytics**: Marketing/business metrics

---

# 7. LAUNCH CHECKLIST (PHASE A1)

### Frontend Readiness
- [ ] All routes implemented and tested
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility: WCAG 2.1 AA
- [ ] Performance: Lighthouse > 80 (all pages)
- [ ] Browser compatibility: Chrome, Safari, Firefox, Edge
- [ ] Error handling + user-friendly error messages

### Integration Testing
- [ ] Auth flow works (login, signup, logout, refresh token)
- [ ] Call initiation + WebRTC connection
- [ ] Transcript updates in real-time
- [ ] Recap generation after call ends
- [ ] Subscription flow (free → pro upgrade)
- [ ] Account settings persist

### Admin Dashboard Readiness
- [ ] Dashboard home metrics accurate
- [ ] Personas CRUD functional
- [ ] User search + filtering works
- [ ] Analytics charts load and display correctly
- [ ] Settings page functions
- [ ] Admin-only routes properly gated

### Security
- [ ] CORS properly configured
- [ ] HTTPS enforced (no HTTP)
- [ ] No secrets in frontend code (all env vars)
- [ ] Rate limiting on API calls
- [ ] CSRF protection on forms
- [ ] XSS protections (sanitize user input)

### Analytics & Monitoring
- [ ] Sentry errors reporting correctly
- [ ] Segment events firing on key actions (sign-up, call start, upgrade)
- [ ] Crash reporting integrated
- [ ] Session replay (optional) working

### User Experience
- [ ] Onboarding flow smooth (landing → signup → first call)
- [ ] Persona library visually appealing
- [ ] Call interface intuitive (mute, hang up, etc.)
- [ ] Recap summary clear and actionable
- [ ] Account settings easy to navigate

---

# 8. SUCCESS CRITERIA (PHASE A1 WEB)

### Technical
- ✅ 0 critical bugs on day 1
- ✅ Page load time < 3 seconds (first contentful paint)
- ✅ 99.9% uptime
- ✅ < 0.5% error rate (5xx errors)

### Product
- ✅ 30% of DAU on web (target: 5k DAU total, 1.5k on web)
- ✅ > 90% call completion on web
- ✅ > 5% conversion to Pro
- ✅ > 40 NPS for web users

### User Experience
- ✅ < 1% bounce rate from landing page
- ✅ > 40% of sign-ups complete first call
- ✅ Avg session length 10-15 min
- ✅ > 2 calls per user in first week (D7)

---

# 9. ROADMAP INTEGRATION (PHASES A2-A4)

This document focuses on **Phase A1 MVP** (June 1). For Phase A2+, web will support:

**Phase A2** (Weeks 9-14):
- Family dashboard (parent view + child profiles)
- Progress tracking per child
- Lesson catalog browsing
- Learning paths

**Phase A3** (Weeks 15-20):
- School admin portal (full rebuild)
- Business team training dashboard
- Org-level analytics + reports
- CIOS integration

**Phase A4** (Weeks 21+):
- Custom persona builder
- API access for partners
- White-label option
- Expert marketplace

---

# 10. GO-LIVE READINESS (PHASE A1 WEB)

### Prerequisites
- [ ] Backend APIs fully tested and deployed
- [ ] Auth integration working (magic link, OAuth)
- [ ] Billing integration (Stripe/PayPal)
- [ ] WebSocket real-time updates stable
- [ ] Monitoring + alerting configured
- [ ] Team trained on deployment process

### Launch Plan
- **Staging**: Deploy week 7, QA testing
- **Production Soft Launch**: June 1 (alongside mobile)
- **Growth Phase**: June-Aug (scale to 1.5k DAU on web)

---

# END OF FILE

**Author**: Web Lead / Architecture
**Last Updated**: April 4, 2026
**Status**: Ready for team to code against
