# AI_OMNIVERSE_WEB_ADMIN_PLAN_2026.md

**Version**: 1.0
**Status**: BATCH S2 DETAILED WEB & ADMIN SPECIFICATION
**Scope**: Complete AI Omniverse web app + admin dashboard architecture and feature specification
**Date**: April 4, 2026
**App Name**: AI Omniverse (Web + Admin Portal)
**Team**: Team A (Web Lead: 1 engineer, Backend support: shared with backend team)

---

# 1. WEB APP OVERVIEW

## 1.1 Purpose

The AI Omniverse web app serves two user types:

1. **End Users** (Homeowners, Office Managers, Venue Operators, Facilities Teams)
   - View and control smart home / office devices
   - Manage rooms and organize spaces
   - Create and execute scenes
   - Set up automations
   - View activity logs and usage
   - Invite family/team members

2. **Admin Users** (AI Omniverse staff, Enterprise admins)
   - Manage device templates (integrations with manufacturers)
   - View user analytics and device usage
   - Manage teams / organizations
   - Support customer issues
   - Feature flags and system configuration

## 1.2 Success Metrics

| Metric | Target | Notes |
|---|---|---|
| **Web DAU** | 40% of total DAU | By end of June |
| **Device control success on web** | > 99% | Same as mobile |
| **Web session length** | 5-10 min | Control-focused, shorter sessions |
| **Scene execution on web** | > 98% success rate | Batch operations |
| **Web accessibility** | WCAG 2.1 AA | From day 1 |
| **Performance (Lighthouse)** | > 80 | Mobile + Desktop |

---

# 2. USER PERSONAS & JOURNEYS

## 2.1 End User Journeys (MVP Phase O1)

### Journey 1: Homeowner First Setup
```
1. Sign up (via shared auth)
2. Onboarding: "Let's set up your smart home"
   - Create home (name, address, type: home/office/venue)
   - Upload optional floorplan
3. Create rooms (living room, kitchen, bedroom)
4. Add devices (QR scan or manual WiFi discovery)
   - Select device type (lights, thermostat, lock, etc)
   - Assign to room
   - Set friendly name
5. Device added → visible on dashboard
6. Test device (toggle light on/off)
7. Create first scene (Movie Time: dim lights, set temp)
8. Prompt to invite family members or try mobile app

Journey time: 15-30 min for full setup
```

### Journey 2: Control Devices from Dashboard
```
1. User logs in → /app/homes
2. Select home
3. View all rooms + devices
4. Click device → Control panel opens
   - Lights: on/off, brightness, color
   - Thermostat: set temperature, mode (heat/cool/auto)
   - Locks: lock/unlock
   - Plugs: on/off
5. Make change (e.g., slider for brightness)
6. Device updates in real-time
7. Activity logged
```

### Journey 3: Execute Scenes
```
1. User on dashboard
2. Click "Scenes" tab
3. List of scenes (Good Morning, Movie Time, Goodnight, etc)
4. Click scene → "Are you sure?" modal
5. Confirm → scene executes
6. UI shows progress (1/5 devices updated, etc)
7. Scene complete → toast notification "Movie Time activated"
```

### Journey 4: Set Up Automation
```
1. User on dashboard
2. Click "Automations" tab
3. "Create Automation" button
4. Form:
   - Trigger: Time (7am) / Presence (arrive home) / Sensor (motion detected)
   - Action: Select devices + desired state
   - Save
5. Automation created, ready to run
6. User can test or disable anytime
```

### Journey 5: Invite Family Members
```
1. Settings → Team / Family
2. "Invite member" button
3. Enter email address
4. Role dropdown: Owner / Admin / Member
5. Send invite
6. Invitee gets email + magic link
7. Can accept and access shared home
```

## 2.2 Admin User Journeys (Om AI Staff)

### Journey 1: Manage Device Templates
```
1. Admin logs in (special auth flag)
2. Sidebar → "Admin Dashboard"
3. Click "Device Templates" or "Integrations"
4. List: Philips Hue, Nest, TP-Link, Yale, etc
5. Click template → Edit form
   - Device type, manufacturer, model
   - API credentials
   - Supported actions (on/off, brightness, etc)
   - Status: Active/Beta/Disabled
6. Save changes
7. Update affects all users with that device type
```

### Journey 2: View Analytics
```
1. Admin dashboard
2. Click "Analytics" or "Insights"
3. Key metrics: DAU, device control success, scene execution, automations
4. Charts: Device adoption, most-used scenes, error rates
5. Filter by device type, user segment, date range
```

---

# 3. FEATURE SPECIFICATION (PHASE O1)

## 3.1 Homepage / Landing Page

### Layout
```
Header
├── Logo "AI Omniverse"
├── Nav: Features | Devices | Pricing | [Login/Signup CTA]
└── Dark mode toggle

Hero Section
├── Headline: "Control your entire physical world with one app"
├── Subheader: "Smart home. Smart office. Smart venue. One app."
├── CTA: "Get Started Free" → /signup
└── Hero image/video (dashboard + devices)

Features Section
├── "Control all your devices in one place"
├── "Create scenes to automate your space"
├── "Works with any device manufacturer"
├── "Voice commands + automations"
└── Social proof (device count, user testimonials)

Supported Devices (grid)
├── Logos: Philips Hue, Nest, TP-Link, LIFX, Yale, Wyze, etc
├── "100+ devices supported"
└── "More coming soon"

Use Cases
├── Homeowner: Smart home, energy savings
├── Office Manager: Meeting rooms, guest experience
├── Venue: Multi-zone control, guest automation
└── Facilities: Large spaces, team coordination

Pricing Section
├── Free tier: 1 home, basic scenes, limited automation
├── Home Pro: Unlimited homes, advanced scenes ($4.99/month or $49/year)
├── Business Space: Teams, advanced automation ($9.99/month per user)
└── FAQs

Footer
├── Links, legal, contact
└── Social links
```

### Pages: `/`, `/login`, `/signup`

Same as Om AI (shared auth core).

---

## 3.2 Authenticated User Pages

### Page: `/app` or `/app/homes` — Home Selection

**Route**: `/app` (default) or `/app/homes`

**Layout**:
```
Sidebar (collapsible on mobile)
├── Logo "AI Omniverse"
├── Nav
│  ├── Dashboard (if home selected)
│  ├── Homes (current section)
│  ├── Devices
│  ├── Scenes
│  ├── Automations
│  ├── Activity Log
│  ├── Settings
│  └── Help / Support
└── Dark mode toggle

Main Content
├── Header: "Your Homes"
├── "Create new home" button (primary)
│
├── Homes Grid (3 columns desktop, 1 mobile)
│  ├── Home Card (repeat)
│  │  ├── Cover image (location photo or floorplan)
│  │  ├── Name: "My House" or "Office"
│  │  ├── Address
│  │  ├── Status: "2 devices online, 1 offline"
│  │  ├── Quick stats:
│  │  │  ├── 5 devices
│  │  │  ├── 3 rooms
│  │  │  └── 2 automations
│  │  ├── Favorite icon (star toggle)
│  │  └── CTA: Click to enter home
│  │
│  └── (repeat for each home)
│
└── Empty state (if no homes)
   ├── "No homes yet"
   ├── "Create your first home to get started"
   └── "Create Home" button
```

**Mobile**:
- Stack cards vertically
- Large tap targets (48px)
- Sidebar becomes hamburger menu

---

### Page: `/app/homes/:homeId` — Home Dashboard

**Route**: `/app/homes/abc123` (using home ID)

**Layout** (desktop, side-by-side):
```
Left Sidebar (30%)
├── Home name, address
├── Status: All online / 1 offline / etc
├── Tabs
│  ├── All Rooms (active)
│  ├── Favorites
│  └── Offline Devices
│
├── Rooms List
│  ├── Room card (repeat)
│  │  ├── Room name: "Living Room"
│  │  ├── Device count: "3 devices"
│  │  ├── Status badges:
│  │  │  ├── Lights: On
│  │  │  └── Temp: 72°F
│  │  └── Click → show devices in room
│  │
│  └── Manage Rooms
│     └── "Add room" button
│
├── Quick Actions
│  ├── "Add device" button
│  ├── "Create scene" button
│  └── "Manage team" button
│
└── Home Settings
   ├── Edit home (name, address, floorplan)
   ├── Invite members
   └── Delete home

Right Main Area (70%)
├── Header: "Living Room" (if room selected) or "All Devices"
├── Device Grid
│  ├── Device Card (repeat)
│  │  ├── Icon (light bulb, thermostat, lock, etc)
│  │  ├── Name: "Ceiling Light"
│  │  ├── Status:
│  │  │  ├── On/Off (toggle switch)
│  │  │  ├── Brightness: ████░░ (70%)
│  │  │  ├── Color: (color picker if supported)
│  │  │  └── Last updated: 2 min ago
│  │  │
│  │  └── Click for detail panel
│  │
│  └── (repeat for all devices in room/home)
│
└── Device Detail Panel (modal or side panel)
   ├── Device name
   ├── Device type: Smart Light
   ├── Room: Living Room
   ├── Manufacturer: Philips Hue
   ├── Model: Hue Color A19
   ├── Status: Online
   ├── Battery: N/A
   ├── Last updated: 2 min ago
   │
   ├── Controls
   │  ├── On/Off toggle (large)
   │  ├── Brightness slider
   │  ├── Color wheel (if supported)
   │  └── Presets (Warm, Cool, Movie, etc)
   │
   ├── Schedule (future)
   │  ├── "Turn on at 7am"
   │  └── View / edit schedule
   │
   └── Actions
      ├── Add to favorite
      ├── Add to scene
      ├── Rename device
      ├── Remove device
      └── More options (menu)
```

**Mobile** (stacked layout):
```
Header
├── Home name + status
├── Menu (hamburger)

Device Grid (single column)
├── Device card
├── Device card
└── ...

Device Detail (full-screen modal)
├── Large controls
└── Bottom actions
```

---

### Page: `/app/homes/:homeId/rooms` — Room Management

**Route**: `/app/homes/abc123/rooms`

**Layout**:
```
Header
├── Title: "Rooms"
├── "Add room" button (primary)

Rooms List
├── Room Card (repeat)
│  ├── Icon (bedroom, kitchen, office, etc)
│  ├── Name: "Living Room"
│  ├── Device count: "5 devices"
│  ├── Quick device badges:
│  │  ├── Lights: On
│  │  ├── Temp: 72°F
│  │  └── Lock: Locked
│  │
│  ├── Click → Expand room details
│  │  ├── Full device list in room
│  │  ├── Individual device controls (inline)
│  │  └── Room-level control (e.g., "Turn off all lights")
│  │
│  └── Actions (edit, delete)
│
└── Add Room Modal
   ├── Room name (text input)
   ├── Room type (dropdown: bedroom, kitchen, living room, office, etc)
   ├── Floor (optional)
   ├── Position on floorplan (optional, map overlay)
   └── Save button
```

---

### Page: `/app/homes/:homeId/scenes` — Scenes Builder & Execution

**Route**: `/app/homes/abc123/scenes`

**Layout**:
```
Header
├── Title: "Scenes"
├── "Create new scene" button (primary)
├── Filter: All, Scheduled, Manual, Triggered

Scenes Grid
├── Scene Card (repeat)
│  ├── Cover icon/color
│  ├── Name: "Movie Time"
│  ├── Description: "Dim lights, close blinds, set sound"
│  ├── Device count: "5 devices"
│  ├── Trigger type: Manual / Time-based / Presence
│  │
│  ├── Status badge: Active / Disabled
│  │
│  └── Actions
│     ├── Quick execute button (play icon)
│     ├── Edit (pencil icon)
│     ├── Duplicate
│     ├── Enable/disable toggle
│     └── Delete
│
└── Empty state (if no scenes)
   ├── "No scenes yet"
   └── "Create your first scene"

Execution Confirmation Modal
├── "Execute 'Movie Time'?"
├── Preview of what will happen:
│  ├── "Ceiling light: Off"
│  ├── "Table lamp: On, Brightness 20%"
│  ├── "Blinds: Close"
│  └── "Temperature: Set to 72°F"
│
├── "Execute" button (green)
└── "Cancel" button

Execution Result
├── Progress: "1/5 devices updated..."
├── Final: "✓ Scene activated" (toast)
└── List of executed actions
```

**Scene Builder** (`/app/homes/:homeId/scenes/new` or `/scenes/:sceneId/edit`):

```
Left Panel: Scene Configuration
├── Scene name (text input)
├── Description (text area)
├── Icon/cover (image upload or picker)
│
├── Trigger Setup (Phase O1)
│  ├── Trigger type: Manual / Time / Presence
│  │  ├── Manual: No trigger (user taps execute)
│  │  ├── Time: Specify time (7:00 AM) + days
│  │  ├── Presence: Arrive home / Leave home
│  │
│  └── Condition (optional): Only execute if condition met
│     ├── (Phase O2+) "Only if sun is down"
│     ├── (Phase O2+) "Only if someone is home"

Right Panel: Device Configuration
├── "Add devices to scene" button
├── Device list (with actions)
│  ├── Device row (repeat)
│  │  ├── Device name: "Ceiling Light"
│  │  ├── Desired state
│  │  │  ├── On/Off toggle
│  │  │  ├── Brightness slider (if applicable)
│  │  │  ├── Color picker (if applicable)
│  │  │  ├── Temperature slider (if thermostat)
│  │  │  └── State (if lock: lock/unlock)
│  │  │
│  │  ├── Delay (optional): "Start after 2 seconds"
│  │  │
│  │  └── Remove button (trash icon)
│  │
│  └── "Add another device" button

Bottom
├── Preview: "When triggered, this scene will:"
│  ├── "Ceiling light: Set to brightness 50%"
│  ├── "Blinds: Close"
│  └── ...
│
├── Save button (primary)
├── Cancel button
└── Delete button (if editing)
```

---

### Page: `/app/homes/:homeId/automations` — Automation Setup

**Route**: `/app/homes/abc123/automations`

**Layout**:
```
Header
├── Title: "Automations"
├── "Create new automation" button

Automations List
├── Automation Card (repeat)
│  ├── Trigger icon + description
│  │  ├── "⏰ At 7:00 AM"
│  │  ├── "📍 When I arrive home"
│  │  ├── "🔴 When motion detected"
│  │  └── ...
│  │
│  ├── Action description:
│  │  ├── "Turn on: Bedroom light, Bathroom light"
│  │  ├── "Set: Thermostat to 72°F"
│  │  └── ...
│  │
│  ├── Enable/disable toggle
│  ├── Last triggered: "Today at 7:05 AM"
│  │
│  └── Actions (edit, duplicate, delete)
│
└── Empty state

Create/Edit Automation Modal
├── Trigger Setup (required)
│  ├── Trigger type selector (radio buttons)
│  │  ├── Time-based
│  │  │  ├── Time picker: 7:00 AM
│  │  │  ├── Days: Mo, Tu, We, Th, Fr, Sa, Su
│  │  │  └── Timezone (user's timezone)
│  │  │
│  │  ├── Presence-based
│  │  │  ├── Trigger on: Arrive home / Leave home
│  │  │  ├── Required users: [Checkboxes for family members]
│  │  │  └── Grace period: 5 minutes (to avoid false triggers)
│  │  │
│  │  └── Sensor-based (Phase O1)
│  │     ├── Sensor device: [Dropdown]
│  │     ├── Trigger: Motion detected, Door opened, etc
│  │     └── Grace period: [Slider, 0-60 seconds]
│  │
│  └── (Phase O2+) Additional conditions:
│     ├── "And: Only if it's dark"
│     ├── "And: Only if nobody is home"
│     └── "And: Only during weekdays"
│
├── Action Setup (required)
│  ├── "Select devices and desired state"
│  ├── Device rows (same as scenes)
│  ├── Add more devices button
│
├── Naming & Details
│  ├── Automation name: "Morning routine"
│  ├── Description (optional)
│  ├── Enable/disable toggle
│
└── Bottom Actions
   ├── Save button
   ├── Cancel button
   ├── Delete button (if editing)
   └── Test automation button (dry-run)
```

---

### Page: `/app/homes/:homeId/activity` — Activity Log

**Route**: `/app/homes/abc123/activity` or `/activity-log`

**Layout**:
```
Header
├── Title: "Activity Log"
├── Filter:
│  ├── All / Manual / Automation / Scene / Device alert
│  ├── Date range picker
│  └── Device filter (select one or all)
├── Search (user who made change)

Activity Timeline
├── Activity Entry (repeat)
│  ├── Timestamp: "Today, 2:30 PM"
│  ├── Actor: "Sarah" (family member) or "Automation: Morning routine"
│  ├── Action: "Turned on Bedroom light"
│  ├── Target: Device or scene name
│  ├── Details:
│  │  ├── Old state: "Off"
│  │  ├── New state: "On, brightness 70%"
│  │  └── Duration (if relevant)
│  │
│  └── Icon (indicates action type)
│
├── Pagination / Load more button

Summary Stats (optional, top of page)
├── "30 actions this week"
├── "Most active user: Sarah"
├── "Most used scene: Movie Time"
└── "Most triggered automation: Morning routine"
```

---

### Page: `/app/settings` — Account & Home Settings

**Route**: `/app/settings` or `/account`

**Tabs**: Profile | Home Settings | Team | Billing | Privacy

**Profile Tab**:
```
├── Avatar upload
├── Display name
├── Email (read-only)
├── Phone (optional)
├── Preferences:
│  ├── Language
│  ├── Theme (Light/Dark/System)
│  ├── Temperature unit (°F / °C)
│  ├── Time format (12hr / 24hr)
│  └── Notification settings (email frequency)
```

**Home Settings Tab**:
```
├── Home name
├── Address
├── Type: Home / Office / Venue
├── Timezone
├── Floorplan upload (optional)
├── Delete home (with confirmation)
```

**Team Tab**:
```
├── Team members list
│  ├── Member name, email, role
│  ├── Last active
│  └── Edit role / Remove
│
├── "Invite member" button
│  ├── Modal: Email + role selector
│  ├── Send invite
│  └── Invitee gets magic link
│
├── Pending invites list
│  ├── Email, role, sent date
│  ├── Resend / Cancel
```

**Billing Tab**:
```
├── Current plan: Free / Home Pro / Business Space
├── Usage (if applicable): X devices / Y automations
├── Next billing date (if paid)
├── Upgrade / Change plan options
├── Payment method on file (masked)
├── Past invoices (download links)
```

**Privacy Tab**:
```
├── Download your data (JSON export)
├── Delete account (with warning modal)
├── Session management (logout all devices)
├── Integrations connected (future)
```

---

## 3.3 Device Onboarding Flow

This is a multi-step wizard for adding devices to a home.

**Route**: `/app/homes/:homeId/devices/add` or `/app/devices/new`

```
Step 1: Select Device Type
├── Grid of device types
│  ├── Smart Lights
│  ├── Thermostats
│  ├── Smart Plugs
│  ├── Smart Locks
│  ├── Cameras
│  └── Other
│
└── Click to select

Step 2: Select Manufacturer
├── List of manufacturers (for selected type)
│  ├── Philips Hue
│  ├── LIFX
│  ├── Nanoleaf
│  └── More...
│
└── Click to select (or show QR code for pairing)

Step 3: Connection Method
├── Tabs: QR Code | WiFi Discovery | Manual Entry
│
├── QR Code (default)
│  ├── "Scan device QR code"
│  ├── Camera permission request
│  ├── QR code reader
│  └── Auto-fill device details
│
├── WiFi Discovery
│  ├── "Looking for devices on your network..."
│  ├── List of found devices
│  ├── Select one
│  └── Proceed
│
└── Manual Entry
   ├── Device name (text input)
   ├── IP address (text input)
   ├── API token (text input, hidden)
   └── Next button

Step 4: Assign to Room
├── Room selector (dropdown)
│  ├── Living Room
│  ├── Bedroom
│  ├── Kitchen
│  └── [Add new room]
│
├── Choose room → Next

Step 5: Name & Customize
├── Device name: "Ceiling Light" (auto-filled, editable)
├── Icon selector (light bulb, lamp, etc)
├── Friendly name (optional, for voice commands)
├── Preferred control method (if multiple supported)

Step 6: Confirmation
├── Summary:
│  ├── Device: Philips Hue Color A19
│  ├── Room: Living Room
│  ├── Name: Ceiling Light
│
├── Test device (toggle on/off)
├── Add device button (green)
└── Options: Skip testing, Add more devices

Success Screen
├── "✓ Ceiling Light added successfully"
├── Show device card with quick controls
├── Suggested next steps:
│  ├── "Add more devices"
│  ├── "Create a scene"
│  ├── "Set up automation"
│  └── Return to home button
```

---

# 4. ADMIN DASHBOARD SPECIFICATION

## 4.1 Admin Authentication & Access

**Access Control**:
- Only AI Omniverse staff can access `/admin`
- Check user role via shared auth (role flag: "omniverse-staff", "support-agent")
- Redirect if not authenticated / authorized

**Admin Entry Point**: `/admin` or `/dashboard/admin`

---

## 4.2 Admin Dashboard Layout

**Navigation**:
```
Sidebar
├── Logo "Omniverse Admin"
├── Search (global: users, homes, devices)
│
├── Main Menu
│  ├── Dashboard (overview)
│  ├── Users
│  │  ├── User directory
│  │  ├── Usage analytics
│  │  └── Support / moderation
│  │
│  ├── Devices
│  │  ├── Device templates (integrations)
│  │  ├── Device directory (all user devices)
│  │  ├── Issue tracking
│  │  └── Firmware updates
│  │
│  ├── Analytics & Insights
│  │  ├── Dashboard metrics
│  │  ├── Device adoption
│  │  ├── Feature usage
│  │  └── Error tracking
│  │
│  ├── Content Management
│  │  ├── Device templates (API configs)
│  │  ├── Device library (models supported)
│  │  ├── Scenes templates
│  │  └── Help content
│  │
│  ├── Settings
│  │  ├── App configuration
│  │  ├── Feature flags
│  │  ├── API keys
│  │  └── Team members
│  │
│  └── Support
│     ├── Support tickets
│     ├── Error logs
│     ├── System health
│     └── Incident tracking
│
└── User menu
   ├── Profile
   └── Logout
```

---

## 4.3 Dashboard Home (`/admin`)

```
Page Header
├── Title: "Admin Dashboard"
├── Date range picker (Last 7 days, 30 days, MTD)

Key Metrics (4-column grid)
├── Card 1: Daily Active Users
│  ├── Number: "4,200"
│  ├── Trend: +10% vs yesterday
│  └── Sparkline
│
├── Card 2: Devices Controlled (Today)
│  ├── Number: "28,500"
│  ├── Trend: +8% vs yesterday
│
├── Card 3: Scene Executions
│  ├── Number: "12,300"
│  ├── Success rate: 98.5%
│  └── Trend
│
└── Card 4: Automations Triggered
   ├── Number: "5,400"
   ├── Success rate: 97.2%
   └── Trend

Charts Section
├── Row 1: DAU Trend (line chart, 30 days)
│
├── Row 1: Device Control Success Rate (gauge)
│  ├── Target: >99%
│  ├── Current: 98.9%
│  └── Status: Warning
│
├── Row 2: Top 10 Devices (bar chart)
│  ├── By control frequency
│  ├── Philips Hue, Nest, TP-Link, etc
│
├── Row 2: Scene Adoption (pie chart)
│  ├── % of homes with scenes
│  ├── Avg scenes per home
│

System Health (bottom)
├── API latency: 145ms (target: <200ms)
├── Error rate: 0.8% (target: <1%)
├── Device response time: 250ms (target: <500ms)
├── Uptime: 99.95% (target: 99.9%)
```

---

## 4.4 Device Templates Management (`/admin/devices/templates`)

**Purpose**: Manage integrations with device manufacturers

```
Header
├── Title: "Device Templates"
├── "Add new template" button

Templates Table
├── Columns:
│  ├── Icon
│  ├── Manufacturer
│  ├── Device type
│  ├── Models supported
│  ├── Status (Active/Beta/Disabled)
│  ├── Actions
│
├── Row (repeat)
│  ├── Philips Hue | Smart Light | Hue Color A19, Hue Go, etc | Active | Edit | Analytics
│  ├── Nest | Thermostat | Learning Thermostat, Nest Hub Max | Active | Edit | Analytics
│  └── ...
│
└── Pagination

Template Detail / Edit (`/admin/devices/templates/:templateId`):

```
Form
├── Manufacturer (read-only or dropdown)
├── Device type (Smart Light, Thermostat, etc)
├── Models (multi-line text, comma-separated)
│
├── API Configuration
│  ├── API endpoint (URL)
│  ├── Authentication method (OAuth, API Key, etc)
│  ├── API key (secret input, hidden)
│  ├── Scopes required (text, auto-filled from spec)
│
├── Supported Actions
│  ├── [x] On/Off
│  ├── [x] Brightness
│  ├── [x] Color
│  ├── [ ] Temperature
│  └── [ ] Custom action
│
├── Supported Properties (read-only, fetched from API)
│  ├── Current state
│  ├── Battery level
│  ├── Signal strength
│  └── Other metadata
│
├── Status
│  ├── Active / Beta / Disabled (radio)
│  ├── If disabled: Reason
│
├── Advanced
│  ├── Timeout (seconds, default 5)
│  ├── Retry logic (enabled/disabled)
│  ├── Rate limiting (requests per second)
│
├── Test Connection
│  ├── "Test API connection" button
│  ├── Result: ✓ Connected or ✗ Failed
│
└── Actions
   ├── Save button
   ├── Test button (dry-run a device control)
   └── Delete button (with confirmation)
```

---

## 4.5 Users & Homes Management (`/admin/users`)

```
Header
├── Title: "Users"
├── Search by name/email
├── Filter:
│  ├── Status: Active, Inactive, Banned
│  ├── Plan: Free, Home Pro, Business Space
│  ├── Joined: Last 7 days, 30 days, custom
│  └── Device count: High (10+), Medium (5-9), Low (1-4)
└── Export (CSV)

Users Table
├── Columns:
│  ├── Name, Email, Status
│  ├── Plan, Homes, Devices
│  ├── Joined, Last active
│  ├── Usage (controls this month)
│  └── Actions
│
├── Row (repeat)
│  ├── Click → /admin/users/:userId (detail)
│
└── Pagination

User Detail (`/admin/users/:userId`):

```
Left Panel: User Info
├── Avatar, name, email
├── Status: Active / Inactive / Banned
├── Plan: Free / Home Pro / Business Space
├── Joined: Apr 1, 2026
├── Last active: Today, 2:30 PM
│
├── Homes Owned
│  ├── "My House" (5 devices, 3 rooms)
│  ├── "Cottage" (8 devices, 4 rooms)
│  └── Total: 2 homes
│
├── Device Stats
│  ├── Total devices: 13
│  ├── Devices online: 12
│  ├── Device errors: 1
│  ├── Most used device: Bedroom light
│
├── Usage This Month
│  ├── Controls: 450
│  ├── Scenes executed: 120
│  ├── Automations triggered: 85
│
├── Support Status
│  ├── Open tickets: 0
│  ├── Last contact: Never
│  └── Support notes: (text area for admin notes)

Right Panel: Actions
├── "Send email to user" button
├── "Ban user" button (with confirmation)
├── "Download user data" button
├── "Delete account" button (with confirmation)
└── Admin notes (text area, save)

Homes List (expandable)
├── Home name, address, status
├── Click to expand devices in home
├── Quick actions: View devices, Manage automations
```

---

## 4.6 Analytics & Insights (`/admin/analytics`)

```
Tabs: Overview | Device Stats | Scene Usage | Automations | Errors

Overview Tab:
├── Same metrics as dashboard home
├── Comparison with previous period

Device Stats Tab:
├── Device adoption (% of users with each device type)
├── Most popular devices (bar chart)
├── Device success rate (% of successful controls by device)
├── Connection issues (table of problematic devices)
│  ├── Device type, issue count, last error
│  └── Actions: View errors, Disable device, Contact manufacturer

Scene Usage Tab:
├── Scene creation trend (line chart)
├── Most popular scenes (bar chart)
├── Scene execution success rate (by scene type)
├── Scene adoption (% of homes with scenes)

Automations Tab:
├── Automation adoption (% of homes with automations)
├── Trigger type usage (pie chart)
│  ├── Time-based
│  ├── Presence-based
│  ├── Sensor-based
│
├── Success rate by trigger type
├── Automation errors (table)

Errors Tab:
├── Error frequency (line chart, 30 days)
├── Error types (bar chart)
│  ├── Device offline, API error, timeout, etc
│
├── Top error sources (devices/manufacturers)
├── Recent errors (table)
│  ├── Timestamp, type, device, user, action
│  ├── Click → error details
```

---

## 4.7 Settings (`/admin/settings`)

```
Sections:

App Configuration:
├── Feature flags (toggles)
│  ├── Scene builder (enabled/disabled)
│  ├── Automations (enabled/disabled, phase control)
│  ├── Voice commands (beta/enabled/disabled)
│
├── Limits
│  ├── Max homes per user
│  ├── Max devices per home
│  ├── Max automations per home
│  ├── Rate limiting (API calls per sec)

Device Integration:
├── Supported manufacturers (list, add/remove)
├── Device discovery timeout (seconds)
├── Retry policy (count, backoff)

Notifications:
├── Alert thresholds
│  ├── Device offline for X minutes
│  ├── High error rate threshold
│  ├── High latency threshold
│
├── Notification recipients (admin emails)

Team Management:
├── Team members (list, add/remove)
├── Roles: Admin, Editor, Viewer
├── Audit log (all changes, timestamps, user)
```

---

# 5. TECHNICAL ARCHITECTURE

## 5.1 Frontend Stack (Web)

**Framework**: React 18 + TypeScript + Next.js (App Router)

**UI Components**:
- Tailwind CSS + Headless UI / Radix UI
- Device control components (toggle, slider, color picker)
- Scene builder (drag-drop, visual editor)
- Automation builder (conditional UI)
- Analytics charts (Recharts, Chart.js)

**State Management**:
- React Query (API state)
- Zustand (client state: selected home, UI state)
- Context API (theme, auth, user)

**Real-time**:
- WebSocket for live device status updates
- Subscription-based updates per home
- Auto-reconnect with backoff

**Code Structure**:
```
app/
├── (marketing)/          # Public pages
│  ├── page.tsx
│  ├── features/page.tsx
│  ├── pricing/page.tsx
│  └── layout.tsx
│
├── (auth)/               # Auth (login, signup)
│  ├── login/page.tsx
│  ├── signup/page.tsx
│  └── layout.tsx
│
├── app/                  # Authenticated app
│  ├── layout.tsx
│  ├── page.tsx           # /app (home selection)
│  │
│  ├── homes/
│  │  ├── page.tsx        # /app/homes (list)
│  │  └── [homeId]/
│  │     ├── layout.tsx
│  │     ├── page.tsx     # Dashboard
│  │     ├── rooms/page.tsx
│  │     ├── devices/
│  │     │  ├── page.tsx
│  │     │  ├── add/page.tsx  # Onboarding wizard
│  │     │  └── [deviceId]/page.tsx
│  │     ├── scenes/
│  │     │  ├── page.tsx
│  │     │  ├── new/page.tsx
│  │     │  └── [sceneId]/page.tsx
│  │     ├── automations/
│  │     │  ├── page.tsx
│  │     │  └── new/page.tsx
│  │     ├── activity/page.tsx
│  │     └── settings/page.tsx
│  │
│  └── settings/
│     └── page.tsx        # Account settings
│
├── admin/                # Admin dashboard
│  ├── layout.tsx
│  ├── page.tsx
│  ├── devices/
│  │  ├── templates/page.tsx
│  │  ├── templates/[templateId]/page.tsx
│  │  └── directory/page.tsx
│  ├── users/
│  │  ├── page.tsx
│  │  └── [userId]/page.tsx
│  ├── analytics/page.tsx
│  └── settings/page.tsx

components/
├── device/               # Device control components
│  ├── DeviceCard.tsx
│  ├── DeviceToggle.tsx
│  ├── BrightnessSlider.tsx
│  ├── ColorPicker.tsx
│  └── DeviceDetailPanel.tsx
│
├── scenes/
│  ├── SceneCard.tsx
│  ├── SceneBuilder.tsx
│  ├── DeviceStateForm.tsx
│  └── ExecutionModal.tsx
│
├── automations/
│  ├── AutomationCard.tsx
│  ├── AutomationBuilder.tsx
│  ├── TriggerSelector.tsx
│  └── ActionConfigurator.tsx
│
├── admin/
│  ├── DashboardMetrics.tsx
│  ├── DeviceTemplatesTable.tsx
│  ├── UsersTable.tsx
│  ├── AnalyticsCharts.tsx
│
└── common/
   ├── Navbar.tsx
   ├── Sidebar.tsx
   ├── DeviceOnboardingWizard.tsx
   └── ActivityTimeline.tsx

lib/
├── api.ts                # API client
├── websocket.ts          # WebSocket real-time updates
├── device-control.ts     # Device control logic
├── scene-execution.ts    # Scene execution helpers
├── automation.ts         # Automation utils
└── hooks.ts              # React hooks (useHome, useDevices, etc)
```

## 5.2 Backend Integration

The web app connects to Omniverse backend via APIs:

**Shared Services** (via `/v1/*`):
- Auth: POST `/v1/auth/login`, GET `/v1/auth/session`
- Billing: GET/POST `/v1/billing/*`

**App-Specific Services** (via `/v2/omniverse/*`):
- Homes: GET/POST `/v2/omniverse/homes/:homeId`
- Rooms: GET/POST `/v2/omniverse/homes/:homeId/rooms`
- Devices: GET/POST/PUT `/v2/omniverse/devices`, POST `/v2/omniverse/devices/:deviceId/control`
- Scenes: GET/POST `/v2/omniverse/scenes`, POST `/v2/omniverse/scenes/:sceneId/execute`
- Automations: GET/POST `/v2/omniverse/automations`
- Activity: GET `/v2/omniverse/activity-log`

**Real-time** (WebSocket):
- WS `/v2/omniverse/ws?homeId=abc123` for device status updates

See `AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md` for full API contracts.

---

# 6. DEPLOYMENT & DEVOPS

## 6.1 Frontend Deployment

**Build & Hosting**: Cloudflare Pages

**Environments**:
- **Production**: `app.omniverse.omdala.com`
- **Staging**: `staging.omniverse.omdala.com`

**Environment Variables**:
```
REACT_APP_API_BASE_URL=https://api.omniverse.omdala.com
REACT_APP_WS_URL=wss://ws.omniverse.omdala.com
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
```

## 6.2 CI/CD Pipeline

Same as Om AI web (GitHub Actions → Cloudflare Pages deploy).

## 6.3 Monitoring

- Sentry for errors
- Segment for analytics
- Web Vitals tracking
- Real-time device control monitoring

---

# 7. LAUNCH CHECKLIST (PHASE O1)

### Frontend Readiness
- [ ] All routes implemented
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility: WCAG 2.1 AA
- [ ] Performance: Lighthouse > 80
- [ ] Browser compatibility

### Integration Testing
- [ ] Auth flow
- [ ] Home + room management
- [ ] Device discovery + pairing
- [ ] Device control (on/off, brightness, etc)
- [ ] Real-time status updates
- [ ] Scene execution
- [ ] Automation setup
- [ ] Activity log
- [ ] Subscription flow

### Security
- [ ] CORS configured
- [ ] HTTPS enforced
- [ ] No secrets in code
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] XSS protection

### Analytics & Monitoring
- [ ] Sentry integration
- [ ] Segment events firing
- [ ] Crash reporting
- [ ] Error tracking

---

# 8. SUCCESS CRITERIA (PHASE O1 WEB)

### Technical
- ✅ 0 critical bugs on day 1
- ✅ < 3 second page load (FCP)
- ✅ 99% device control success on web
- ✅ 99.9% uptime

### Product
- ✅ 40% of DAU on web (target: 4k DAU on web)
- ✅ > 99% device control success
- ✅ > 98% scene execution success
- ✅ > 40 NPS for web users

### User Experience
- ✅ Onboarding completes in <30 min
- ✅ Device control is 1-2 taps
- ✅ Scene execution is 1 tap
- ✅ < 500ms response time for controls

---

# 9. ROADMAP INTEGRATION (PHASES O2-O4)

This document focuses on Phase O1 MVP. Phase O2+ will add:

**Phase O2** (Weeks 9-14):
- Matter protocol support
- Advanced automations (if-then-else)
- Device grouping / zones
- Geofencing automation

**Phase O3** (Weeks 15-20):
- Machine learning scheduling
- Energy optimization dashboard
- Multi-property support
- Enterprise admin features

**Phase O4** (Weeks 21+):
- Full device graph visualization
- AI-driven suggestions
- Custom integrations API
- White-label dashboard

---

# 10. GO-LIVE READINESS (PHASE O1 WEB)

### Prerequisites
- [ ] Backend APIs stable
- [ ] WebSocket real-time working
- [ ] Device gateway functional
- [ ] Monitoring set up
- [ ] Team trained on deployment

### Launch Plan
- **Staging**: Week 7
- **Production Soft Launch**: June 1 (with mobile)
- **Growth Phase**: June-Aug

---

# END OF FILE

**Author**: Web Lead / Architecture
**Last Updated**: April 4, 2026
**Status**: Ready for team to code against
