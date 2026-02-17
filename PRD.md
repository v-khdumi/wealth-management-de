# Wealth Management Demo + GenAI Copilot

A bank-grade demonstration platform showcasing modern wealth management capabilities enhanced with responsible GenAI assistance for advisors and clients.

**Experience Qualities**:
1. **Professional** - Evoke trust and competence through refined typography, structured layouts, and precise data presentation that mirrors enterprise financial platforms
2. **Transparent** - Make AI reasoning visible and auditable, clearly distinguish demo content from production features, and present complex financial data with clarity
3. **Empowering** - Help advisors serve clients better and help clients understand their wealth through contextual AI explanations grounded in their actual data

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This platform manages role-based access, real-time portfolio calculations, multi-step order workflows, audit logging, and AI-powered contextual assistance across advisor and client experiences. It requires sophisticated state management, data modeling, and careful AI prompt engineering with fact grounding.

## Essential Features

### Authentication & Role Selection
- **Functionality**: Select role (Advisor/Client) and user identity from seeded personas
- **Purpose**: Demonstrate RBAC without production OAuth complexity, enable quick role-switching for demos
- **Trigger**: Landing page presents role cards and user dropdown
- **Progression**: Select role → Choose user → Enter dashboard (redirects based on role)
- **Success criteria**: Advisors access all clients, clients see only their own data, no unauthorized access possible

### Advisor Dashboard & KPIs
- **Functionality**: Display AUM, client count, active alerts, pending orders; searchable/filterable client list
- **Purpose**: Give advisors portfolio-level view of their book and quick access to clients needing attention
- **Trigger**: Advisor login or navigation to /advisor/dashboard
- **Progression**: View KPIs → Review next best actions → Search/filter clients → Click client to drill down
- **Success criteria**: Real-time calculated metrics, accurate client filtering, visible action items

### Advisor Copilot (GenAI)
- **Functionality**: Natural language Q&A about clients or advisor's book, grounded in seeded data
- **Purpose**: Accelerate advisor research and client preparation with AI-synthesized insights
- **Trigger**: Type question in copilot panel (always-visible on advisor pages)
- **Progression**: Enter question → AI retrieves relevant facts → Generates grounded response → Shows sources used → Logs interaction to audit trail
- **Success criteria**: Responses cite only factual data, include disclaimers, log to audit trail, work offline with mock responses

### Client Profile View
- **Functionality**: Display demographics, risk profile (score 1-10, category, age), goals with progress tracking
- **Purpose**: Give advisors comprehensive client context for personalized advice
- **Trigger**: Select client from advisor dashboard or client views own profile
- **Progression**: View profile → Check risk profile freshness → Review goal progress → Identify gaps → Take action (update risk, add goal, create order)
- **Success criteria**: Risk profile shows staleness warnings (>180 days), goal gaps calculate correctly, "Explain this client" AI button generates professional briefing

### Portfolio View & Analysis
- **Functionality**: Holdings table, asset allocation chart, drift vs recommended model, performance metrics
- **Purpose**: Visualize portfolio composition and identify rebalancing needs
- **Trigger**: Navigate to portfolio tab
- **Progression**: View holdings → See allocation chart → Compare to model → Identify drift → Review AI explanation → Create rebalancing order
- **Success criteria**: Drift % calculated correctly, model recommendation follows rules, AI explanation references actual holdings and percentages

### Model Portfolio Recommendations
- **Functionality**: Rule-based assignment of target model based on risk score, with allocation targets
- **Purpose**: Provide personalized asset allocation guidance aligned with risk tolerance
- **Trigger**: Automatic on portfolio load based on client risk score
- **Progression**: Risk score determines model → Model defines target allocations → Drift calculated → Recommendation shown if drift > threshold
- **Success criteria**: Conservative (1-3), Balanced (4-5), Growth (6-7), Aggressive (8-10) mapping works, allocations sum to 100%

### Paper Trading & Order Management
- **Functionality**: Create buy/sell orders, validate suitability/cash/exposure, simulate execution after delay
- **Purpose**: Demonstrate trade workflow with compliance checks and realistic lifecycle
- **Trigger**: Click "New Order" button on portfolio page
- **Progression**: Select instrument → Enter quantity → Choose order type → Validate suitability → Submit → Order enters PENDING → Executes after 2s → Holdings/cash update → Audit logged
- **Success criteria**: Validation blocks unsuitable trades, insufficient cash, excessive concentration; idempotency prevents duplicates; AI can draft order notes

### Next Best Actions (Rule Engine)
- **Functionality**: Automated recommendations based on portfolio/profile rules
- **Purpose**: Surface proactive opportunities for advisors to add value
- **Trigger**: Calculated on dashboard load and client profile load
- **Progression**: Rules evaluate client state → Actions generated if thresholds met → Displayed with priority → Advisor clicks action → Navigates to relevant page → Takes action
- **Success criteria**: Goal gap >$50k suggests increase, risk >180d suggests refresh, drift >8% suggests rebalance, cash >10% suggests invest

### Goals Planning & Tracking
- **Functionality**: Define retirement/house/education goals with target amount/date, track progress, calculate gap and suggested monthly contribution
- **Purpose**: Help clients visualize long-term objectives and required savings
- **Trigger**: Navigate to goals tab, click "Add Goal"
- **Progression**: Enter goal details → System calculates monthly need → Shows progress bar → Updates as portfolio value changes → AI explains gap and options
- **Success criteria**: Math accurately calculates months remaining and required monthly contribution, progress reflects actual portfolio allocation to goal

### Audit Trail & AI Logging
- **Functionality**: Immutable log of all material actions (risk updates, orders, goal changes) and AI interactions (prompts, responses, tokens)
- **Purpose**: Provide compliance audit capability and AI transparency
- **Trigger**: Automatic on every logged action; viewable on client detail page
- **Progression**: Action occurs → Event written with timestamp, actor, details → Displayed in chronological feed → AI events show expand/collapse for prompt/response
- **Success criteria**: All critical actions logged, AI interactions include full prompt/response, events immutable, filterable by type

## Edge Case Handling

- **Insufficient Cash for Order**: Validation blocks order submission, displays required amount vs available cash with clear error message
- **Instrument Not Suitable for Risk Profile**: Suitability check prevents high-risk instruments for conservative clients, shows explanation of mismatch
- **Stale Risk Profile**: Warning badge on profiles >180 days old, surfaces in next best actions, advisor prompted to refresh
- **Extreme Portfolio Concentration**: If single holding >40%, warning displayed and rebalance action suggested
- **AI Offline Mode**: All AI features gracefully degrade to deterministic mock responses when spark.llm unavailable, clearly labeled as "Demo Response"
- **Empty Portfolio**: Show onboarding message with "Fund Account" CTA instead of empty table
- **Division by Zero in Returns**: Handle zero initial value gracefully in performance calculations, show "N/A" instead of Infinity
- **Missing Goal Target Date**: Require target date for monthly contribution calculation, default to 30 years if somehow omitted
- **Duplicate Order Submission**: Idempotency check prevents processing same order twice within 60s window

## Design Direction

The design should evoke **institutional trust, precision, and modern sophistication**. This is software for managing significant wealth—it must feel serious, competent, and thoughtfully engineered. Visual cues should communicate data integrity, careful construction, and professional-grade tooling. The AI features should feel like thoughtful augmentation, not gimmicks—helpful assistants that make complex information accessible without oversimplifying.

## Color Selection

A refined palette balancing traditional financial trustworthiness (navy, slate) with contemporary fintech energy (teal accents).

- **Primary Color**: Deep Navy `oklch(0.25 0.05 250)` - Conveys authority, stability, and financial expertise; used for primary actions and key navigation
- **Secondary Colors**: 
  - Slate `oklch(0.45 0.01 250)` for secondary buttons and muted backgrounds
  - Warm Gray `oklch(0.55 0.02 80)` for borders and dividers
- **Accent Color**: Vibrant Teal `oklch(0.65 0.15 195)` - Represents innovation and AI features, used for GenAI copilot elements, focus states, and positive confirmations
- **Foreground/Background Pairings**:
  - Primary Navy (oklch(0.25 0.05 250)): White text (oklch(0.99 0 0)) - Ratio 11.2:1 ✓
  - Accent Teal (oklch(0.65 0.15 195)): Dark Navy text (oklch(0.20 0.05 250)) - Ratio 7.8:1 ✓
  - Background (oklch(0.98 0.005 250)): Dark text (oklch(0.20 0.02 250)) - Ratio 14.5:1 ✓
  - Muted (oklch(0.94 0.01 250)): Slate text (oklch(0.40 0.02 250)) - Ratio 8.9:1 ✓

## Font Selection

Typography must communicate precision and trustworthiness while remaining highly readable across dense financial tables and dashboard metrics.

- **Primary**: **Inter** for UI elements, tables, and body text—geometric precision with excellent readability at small sizes for dense data tables
- **Display**: **Space Grotesk** for headings and KPI numbers—distinctive character that adds modern personality without sacrificing legibility

**Typographic Hierarchy**:
- H1 (Page Titles): Space Grotesk Bold / 32px / tight letter-spacing (-0.02em) / line-height 1.2
- H2 (Section Headers): Space Grotesk Semibold / 24px / tight letter-spacing / line-height 1.3
- H3 (Card Titles): Inter Semibold / 18px / normal / line-height 1.4
- Body (General Text): Inter Regular / 15px / normal / line-height 1.6
- Small (Labels, Captions): Inter Medium / 13px / normal / line-height 1.5
- Tables: Inter Regular / 14px / tabular-nums / line-height 1.5
- KPI Numbers: Space Grotesk Bold / 28px / tabular-nums / line-height 1.2

## Animations

Animations should reinforce **data state transitions and system responsiveness** while maintaining professional restraint. Use motion to clarify cause-and-effect (order submission → execution), guide attention to updated values (portfolio recalculation), and provide confident feedback. Avoid decorative motion—every animation serves data comprehension or confirms user action.

- Page transitions: 250ms ease-out for tab switching and navigation
- AI response generation: Subtle pulse on copilot panel while loading, smooth fade-in for response text
- Order execution: Progress indicator transitions from "validating" → "executing" → "complete" with color shift
- KPI updates: Brief highlight flash (300ms) when dashboard values recalculate
- Hover states: 120ms ease-in-out for button state changes
- Chart interactions: 200ms for tooltip appearance and bar/segment highlights

## Component Selection

**Components**:
- **Dashboard KPIs**: Custom cards with Space Grotesk numbers, Inter labels, subtle shadow and border, animated value transitions
- **Client List**: Shadcn Table with sortable columns, row hover states, sticky header for long lists
- **Portfolio Holdings**: Shadcn Table with tabular-nums, color-coded performance cells (green/red), expandable rows for transaction history
- **Allocation Chart**: Recharts PieChart with custom tooltips showing percentage and dollar value, synchronized hover states
- **Advisor Copilot Panel**: Shadcn Card with Textarea for input, Button for submit, ScrollArea for conversation history, distinct teal accent border
- **Next Best Actions**: Custom list with Badge for priority, phosphor icons for action type, subtle pulse animation for high-priority items
- **Order Form**: Shadcn Form with Input, Select, RadioGroup for order type, validation error display, confirmation Dialog
- **Risk Profile Display**: Custom component with progress bar (1-10 scale), Badge for category, warning icon if stale
- **Goals Tracker**: Custom cards with Progress component, calculated values in Space Grotesk, "Add Goal" using Dialog
- **Audit Trail**: ScrollArea with timeline-style events, Accordion for AI interaction details (expand to see prompt/response)
- **Navigation**: Shadcn Tabs for client detail sections (Profile/Portfolio/Orders/Goals), sidebar navigation for advisor

**Customizations**:
- Custom AI response card with teal left-border accent and "Sources Used" collapsible section
- Custom metric card component combining large numbers (Space Grotesk) with trend indicators (phosphor icons)
- Custom allocation drift indicator showing current vs target with color-coded variance
- Custom order status badge with lifecycle-specific colors (pending=yellow, executed=green, failed=red)

**States**:
- Buttons: Default subtle shadow, hover lifts slightly with deeper shadow, active scales down 98%, disabled reduces opacity to 40%
- Inputs: Default slate border, focus shows teal ring with 2px offset, error state red border and shake animation
- Tables: Row hover applies subtle background tint, selected row shows teal left-border accent
- AI Panel: Idle state muted, loading shows pulsing teal border, response arrived shows brief glow then settles

**Icon Selection** (phosphor-icons):
- ChartLine: Portfolio performance
- Target: Goals
- ShieldCheck: Risk profile
- ArrowsLeftRight: Orders/trades
- BriefCase: Advisor role
- User: Client role
- Sparkle: AI features
- ClockCounterClockwise: Audit trail
- TrendUp/TrendDown: Performance indicators
- Warning: Alerts and compliance warnings

**Spacing**:
- Page padding: px-8 py-6
- Card padding: p-6
- Section gaps: gap-6 for major sections, gap-4 for related items, gap-2 for tight groupings
- Table cell padding: px-4 py-3
- Form field spacing: space-y-4

**Mobile**:
- Stack KPI cards vertically below 1024px
- Convert client table to card list below 768px
- Hide copilot panel on mobile, accessible via floating action button
- Charts resize to full-width container
- Navigation converts to bottom tab bar on mobile
- Forms maintain single column, buttons expand to full-width
