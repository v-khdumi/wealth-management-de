# Personal Wealth Dashboard + AI Financial Assistant

A client-focused wealth management platform that puts individuals in control of their financial future with AI-powered insights and guidance.

**Experience Qualities**:
1. **Empowering** - Give clients direct control and understanding of their wealth through clear visualizations, plain-language explanations, and actionable insights
2. **Approachable** - Make complex financial concepts accessible through conversational AI, intuitive design, and educational content tailored to individual goals
3. **Trustworthy** - Build confidence through transparent data, grounded AI explanations, and clear disclosure of information sources and limitations

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This platform manages personalized portfolio tracking, goal planning, intelligent rebalancing suggestions, AI-powered financial guidance, and transaction management. It requires sophisticated state management, real-time calculations, and careful AI prompt engineering with fact grounding focused on individual client needs.

## Essential Features

### Simple Account Selection
- **Functionality**: Select from demo client personas to explore different financial situations
- **Purpose**: Allow users to see how the platform works for different wealth levels and life stages
- **Trigger**: Landing page presents client cards with brief descriptions
- **Progression**: View persona cards → Select a persona → Enter personalized dashboard
- **Success criteria**: Each persona shows appropriate portfolio size, goals, and financial situation

### Personal Dashboard & Financial Overview
- **Functionality**: Display total wealth, portfolio performance, asset allocation, and personalized insights
- **Purpose**: Give clients immediate understanding of their financial health and progress toward goals
- **Trigger**: Login or navigation to home dashboard
- **Progression**: View wealth snapshot → Review performance → Check goal progress → See personalized recommendations → Ask AI assistant questions
- **Success criteria**: Real-time calculated metrics, clear visual hierarchy, actionable next steps prominently displayed

### Personalized Financial Insights Dashboard
- **Functionality**: Comprehensive AI-powered analysis of complete financial picture with health scoring, actionable recommendations, and detailed insights
- **Purpose**: Provide holistic view of financial health with prioritized actions and personalized guidance
- **Trigger**: Navigate to "Insights" tab or click "View Insights Dashboard" from overview
- **Progression**: View portfolio health score → Review goals status breakdown → See priority actions ranked by importance → Generate AI insights → Read comprehensive analysis → Take recommended actions
- **Success criteria**: Health score accurately reflects portfolio alignment with goals and risk profile, AI insights are specific to user's actual data, recommendations are prioritized and actionable, all metrics clearly explained

### AI Financial Assistant
- **Functionality**: Natural language Q&A about personal finances, portfolio, goals, and investment strategies
- **Purpose**: Demystify financial decisions and provide personalized guidance in plain language
- **Trigger**: Type question in always-visible assistant panel or click quick-ask prompts
- **Progression**: Ask question → AI retrieves personal financial facts → Generates personalized response → Shows data sources → Explains reasoning → Offers follow-up actions
- **Success criteria**: Responses use client's actual data, avoid jargon, include educational context, clearly state when information is unavailable

### Personal Profile & Risk Assessment
- **Functionality**: View and update personal information, risk tolerance, investment preferences, and financial goals
- **Purpose**: Keep financial plan aligned with life changes and evolving priorities
- **Trigger**: Navigate to profile section or prompted by AI assistant when profile is outdated
- **Progression**: View current profile → Update risk tolerance questionnaire → Review recommended changes → Confirm updates → See how changes affect portfolio recommendations
- **Success criteria**: Risk assessment drives portfolio recommendations, stale profiles (>180 days) trigger friendly reminders, AI explains implications of risk changes

### My Portfolio & Investments
- **Functionality**: Visual breakdown of all holdings, asset allocation, performance over time, and investment recommendations
- **Purpose**: Help clients understand what they own, how it's performing, and if it aligns with their goals
- **Trigger**: Navigate to "My Portfolio" section
- **Progression**: View holdings overview → Explore allocation charts → Check performance → Review AI-powered insights → See rebalancing suggestions → Ask AI questions about specific investments
- **Success criteria**: Clear visualizations, performance shown in context, AI explains portfolio composition in plain language, recommendations feel personalized

### Personalized Investment Recommendations
- **Functionality**: AI-powered suggestions for portfolio adjustments based on goals, risk tolerance, and market conditions
- **Purpose**: Provide actionable guidance for optimizing wealth without requiring financial expertise
- **Trigger**: Automatic analysis when viewing portfolio, or ask AI assistant directly
- **Progression**: Portfolio analyzed against goals and risk profile → Gaps identified → Recommendations generated → AI explains why changes make sense → Client can explore or implement suggestions
- **Success criteria**: Recommendations clearly tied to specific goals, explanations use client's actual numbers, options presented with pros/cons

### Easy Investment Actions
- **Functionality**: Simple interface to buy/sell investments, transfer funds, or implement AI recommendations
- **Purpose**: Make investing straightforward while ensuring decisions align with risk tolerance and goals
- **Trigger**: Click "Make Changes" from portfolio or recommendations
- **Progression**: Select action type → Choose investment → Enter amount → See impact preview → Review AI explanation → Confirm → Transaction processes → Portfolio updates
- **Success criteria**: Clear warnings for risky actions, confirmation shows before/after comparison, AI explains immediate and long-term impact

### Smart Suggestions & Insights
- **Functionality**: Proactive notifications about opportunities, risks, and recommended actions
- **Purpose**: Keep clients on track toward goals without constant monitoring
- **Trigger**: Displayed on dashboard; updated as financial situation changes
- **Progression**: System evaluates goals and portfolio → Identifies opportunities or concerns → Generates friendly suggestions → Client reviews → Can ask AI to explain → Takes action or dismisses
- **Success criteria**: Suggestions feel helpful not pushy, AI explains reasoning clearly, priorities ranked by impact on goals

### Financial Goals & Planning
- **Functionality**: Create and track life goals (retirement, home purchase, education) with progress visualization and savings recommendations
- **Purpose**: Connect daily investment decisions to meaningful life objectives
- **Trigger**: Navigate to "My Goals" section or click "Add Goal" from dashboard
- **Progression**: Click Add Goal → Browse goal templates by category → Select template → Customize amount and timeline → View helpful tips → Review calculated monthly contribution → Create goal → View progress visualization → Get personalized tips → Adjust contributions → See updated projections
- **Success criteria**: Math accurately projects required monthly savings, progress bars motivate action, AI explains trade-offs and options in accessible language, templates make goal creation quick and intuitive

### Goal Templates for Common Milestones
- **Functionality**: Pre-configured templates for popular financial goals with suggested amounts, timelines, and helpful tips
- **Purpose**: Make goal creation faster and help users set realistic targets based on common benchmarks
- **Trigger**: Click "Add Goal" button from Goals tab
- **Progression**: View goal template library → Filter by category (Popular, Retirement, Home, Education, Other) → Search for specific goals → Select template → Review suggested amount and timeline → Adjust sliders to customize → Read helpful tips → See calculated monthly contribution → Create goal
- **Success criteria**: Templates cover major life milestones, amounts reflect realistic benchmarks, tips provide actionable guidance, customization allows personalization while maintaining realistic ranges

### Age and Risk-Based Goal Recommendations
- **Functionality**: Intelligent template suggestions based on user's age and risk profile
- **Purpose**: Surface the most relevant goals for each user's life stage and financial personality
- **Trigger**: Open goal template dialog with "For You" personalized tab
- **Progression**: System analyzes age and risk score → Selects 3-6 most relevant templates → Displays in "For You" tab with explanation → User can explore recommendations or browse all templates
- **Success criteria**: Recommendations feel personally relevant, explanation clearly states why goals were selected (age and risk factors), users under 30 see emergency fund and first home goals, users 45+ see retirement and education goals, high risk users see entrepreneurial goals, conservative users see safety-focused goals

### Custom Goal Creation
- **Functionality**: Create completely personalized financial goals beyond standard templates
- **Purpose**: Allow users to plan for unique dreams and aspirations not covered by templates
- **Trigger**: Click "Create Custom Goal" option in template dialog
- **Progression**: Open custom goal form → Enter goal name → Select category → Set target amount with slider → Set time horizon → Preview monthly contribution → Create goal
- **Success criteria**: Form is simple and intuitive, sliders allow wide range of amounts ($1k-$2M) and timelines (1-40 years), calculations shown in real-time, custom goals clearly marked in goals list

### Goal Progress Milestones with Celebrations
- **Functionality**: Track achievement of milestone percentages (10%, 25%, 50%, 75%, 100%) with animated celebrations
- **Purpose**: Maintain motivation and celebrate financial progress along the journey
- **Trigger**: When goal progress crosses a milestone threshold (simulated via demo button or actual contribution updates)
- **Progression**: Progress updates → System detects milestone crossed → Celebration animation appears with confetti → Shows achievement message → Displays current vs target amounts → Encourages continued progress → Milestone badge added to goal card
- **Success criteria**: Animations feel delightful not intrusive, messages are encouraging and personalized, milestones are tracked and prevent duplicate celebrations, goal cards show milestone badges, confetti uses theme colors and feels celebratory

### Goal Analytics & Historical Trends
- **Functionality**: Visualize goal progress over time with historical snapshots, trend analysis, and future projections
- **Purpose**: Help users understand their savings patterns and see if they're on track to meet deadlines
- **Trigger**: Click "View Details" on any goal → Navigate to Analytics tab
- **Progression**: View historical progress chart showing saved amounts over time → See trend analysis (accelerating/steady) → Review average monthly growth statistics → View projection chart showing predicted future progress → Read AI-generated insights about pace and recommendations
- **Success criteria**: Charts are clear and easy to understand, trend calculations are accurate, projections use realistic averages, insights provide actionable guidance, users can see if they're ahead or behind schedule

### Goal Sharing with Family Feedback
- **Functionality**: Share financial goals with family members and receive supportive feedback
- **Purpose**: Build accountability and support system for achieving financial milestones
- **Trigger**: Click "View Details" on goal → Navigate to Sharing tab → Click "Share with Family Member"
- **Progression**: Enter family member name and email → Send invitation → Family member views goal progress → Family member provides feedback (supportive, concerned, or neutral) → User receives notification → User reads feedback → Can respond or adjust goal based on input
- **Success criteria**: Sharing process is simple, feedback includes sentiment indicators (heart for supportive, warning for concerned), unread feedback is clearly marked, users can simulate feedback in demo mode, family members shown with avatars and contact info

### Goal Dependencies & Relationship Tracking
- **Functionality**: Link related goals together to show dependencies and relationships between financial milestones
- **Purpose**: Help users understand how goals interconnect and prioritize accordingly
- **Trigger**: Click "View Details" on goal → Navigate to Dependencies tab → Click "Add Dependency"
- **Progression**: Select related goal → Choose relationship type (Blocks, Enables, Related) → Add description → View dependency graph → See warnings for blocked goals → Get notifications when prerequisite goals are completed → Adjust priorities based on dependencies
- **Success criteria**: Three relationship types clearly explained, visual indicators show blocking vs enabling relationships, system warns when pursuing goal that's blocked by incomplete prerequisite, completion of enabling goals triggers positive notifications, dependency count visible on goal cards

### Goal Comparison View
- **Functionality**: Compare multiple goals side-by-side to analyze trade-offs and make informed prioritization decisions
- **Purpose**: Help users understand competing financial priorities and optimize allocation of limited resources
- **Trigger**: Click "Compare Goals" button from Goals tab when 2+ goals exist
- **Progression**: Select 2-4 goals to compare → View side-by-side comparison showing target amounts, timelines, monthly contributions, progress, and projected completion → See visual comparison chart → Review AI analysis of trade-offs → Adjust priorities or contributions → Save changes
- **Success criteria**: Comparison clearly shows key metrics in parallel, highlights differences in urgency and feasibility, AI provides personalized guidance on prioritization, users can quickly identify which goals need more attention

### Life Event Goal Templates
- **Functionality**: Specialized goal templates for major life milestones like weddings, sabbaticals, starting a business, and other significant events
- **Purpose**: Make planning for life-changing events easier with realistic budgets and timelines
- **Trigger**: Browse goal templates under "Life Events" category
- **Progression**: Explore life event templates (Wedding, Sabbatical, Start Business, Career Change, Home Renovation, etc.) → Select template → Review suggested amounts and timelines → Customize to personal situation → Read expert tips → Create goal
- **Success criteria**: Templates cover 8+ major life events, amounts reflect realistic regional averages, tips provide actionable planning guidance, templates feel inspiring and supportive

### Collaborative Family Budgeting
- **Functionality**: Create shared family budget goals where multiple family members can contribute and track progress together
- **Purpose**: Enable transparent financial planning for household expenses and shared goals
- **Trigger**: Create new goal → Toggle "Make this a family goal" → Invite family members
- **Progression**: Create family goal (vacation, home purchase, education) → Set total target → Invite family members via email → Each member pledges monthly contribution → View combined progress → Track individual contributions → See who's on track → Celebrate milestones together → Receive notifications when contributions are made
- **Success criteria**: Clear visualization of each person's contribution, total progress shows combined effort, members can adjust their pledges, notifications keep everyone engaged, demo mode allows simulating multiple contributors

### Activity History & Transparency
- **Functionality**: Complete log of all transactions, AI interactions, and portfolio changes
- **Purpose**: Build trust through total transparency and help clients understand past decisions
- **Trigger**: Navigate to "Activity" section; also viewable from AI assistant
- **Progression**: View timeline of actions → Filter by type (transactions, AI chats, portfolio changes) → Expand details → Review AI conversation history → See reasoning behind past recommendations
- **Success criteria**: All actions logged with timestamps, AI interactions show full context, clients can review and learn from history

## Edge Case Handling

- **Insufficient Funds for Investment**: Clear explanation of available cash, suggestion to sell other holdings or add funds, AI explains impact options
- **Investment Too Risky for Profile**: System prevents purchase, AI explains why it doesn't match risk tolerance, suggests suitable alternatives
- **Outdated Risk Profile**: Friendly reminder appears after 180 days, simple questionnaire to refresh, AI explains how changes might affect recommendations
- **Concentrated Portfolio**: Warning appears if single holding >40%, AI explains diversification benefits, suggests specific rebalancing actions
- **AI Service Unavailable**: All AI features show helpful placeholder responses, clearly marked as demo content, core portfolio functions still work
- **No Investments Yet**: Welcoming onboarding experience, AI offers to explain investing basics, clear CTAs to fund account and start investing
- **Goal Deadline Passed**: Gentle handling of missed goals, AI helps reframe or extend timeline, focus on progress made rather than failure
- **Extreme Market Movements**: AI provides context and reassurance during volatility, explains long-term perspective, discourages panic decisions
- **Conflicting Goals**: When goals compete for limited funds, AI helps prioritize based on urgency and personal values

## Design Direction

The design should evoke **personal empowerment, clarity, and growth**. This is software that helps individuals take control of their financial future—it must feel encouraging, accessible, and confidence-building. Visual language should communicate progress, possibility, and human-centered design. The AI assistant should feel like a knowledgeable friend, not a corporate tool—helpful, patient, and genuinely invested in the user's success.

## Color Selection

A vibrant yet trustworthy palette balancing approachability (warm greens suggesting growth) with professionalism (deep blues for stability).

- **Primary Color**: Rich Forest Green `oklch(0.45 0.12 155)` - Represents growth, prosperity, and environmental consciousness; used for positive actions, progress indicators, and success states
- **Secondary Colors**: 
  - Deep Ocean Blue `oklch(0.35 0.08 240)` for trust, stability, and secondary buttons
  - Warm Amber `oklch(0.70 0.15 75)` for highlights and important calls-to-action
- **Accent Color**: Vibrant Cyan `oklch(0.65 0.15 195)` - Represents innovation and AI features, used for the AI assistant, interactive elements, and insights
- **Foreground/Background Pairings**:
  - Primary Green (oklch(0.45 0.12 155)): White text (oklch(0.99 0 0)) - Ratio 8.2:1 ✓
  - Accent Cyan (oklch(0.65 0.15 195)): Dark Navy text (oklch(0.20 0.05 240)) - Ratio 7.8:1 ✓
  - Background (oklch(0.98 0.005 155)): Dark text (oklch(0.20 0.02 155)) - Ratio 14.5:1 ✓
  - Amber (oklch(0.70 0.15 75)): Dark text (oklch(0.25 0.05 75)) - Ratio 6.5:1 ✓

## Font Selection

Typography must feel friendly and modern while maintaining clarity for financial data and dense information displays.

- **Primary**: **Plus Jakarta Sans** for UI elements, tables, and body text—humanist warmth with excellent readability, friendlier than corporate fonts
- **Display**: **Outfit** for headings and large numbers—geometric and bold for impact, distinctly modern

**Typographic Hierarchy**:
- H1 (Page Titles): Outfit Bold / 36px / tight letter-spacing (-0.01em) / line-height 1.2
- H2 (Section Headers): Outfit Semibold / 26px / normal / line-height 1.3
- H3 (Card Titles): Plus Jakarta Sans Bold / 18px / normal / line-height 1.4
- Body (General Text): Plus Jakarta Sans Regular / 15px / normal / line-height 1.6
- Small (Labels, Captions): Plus Jakarta Sans Medium / 13px / normal / line-height 1.5
- Tables: Plus Jakarta Sans Regular / 14px / tabular-nums / line-height 1.5
- Large Numbers: Outfit Bold / 32px / tabular-nums / line-height 1.1

## Animations

Animations should communicate **progress, growth, and positive momentum** while providing clear feedback. Use motion to celebrate achievements (goal progress), clarify state changes (investment execution), and make the AI assistant feel responsive and alive. Every animation should feel encouraging and purposeful.

- Page transitions: 300ms ease-out with subtle slide for navigation feeling like forward progress
- AI assistant responses: Gentle typing animation effect (100ms per character group) to feel conversational
- Goal progress updates: Smooth bar growth animation (500ms) with celebration effect when milestones hit
- Investment execution: Multi-step progress indicator with checkmarks appearing sequentially
- Success states: Brief scale-up pulse (200ms) with soft glow for completed actions
- Hover states: 150ms ease-in-out with gentle lift for interactive elements
- Chart interactions: 250ms smooth transitions for data updates and tooltip appearances

## Component Selection

**Components**:
- **Dashboard Wealth Cards**: Large, friendly cards with Outfit numbers, Plus Jakarta Sans labels, soft shadows, growth animations on value updates
- **Insights Dashboard**: Comprehensive view with health score ring, goals status breakdown, priority actions list, AI-generated insights card with prominent CTA
- **Portfolio Holdings**: Shadcn Table with clear hierarchy, color-coded gains/losses, tap to expand for details on mobile
- **Allocation Visualization**: Recharts DonutChart with interactive segments, smooth transitions, clear labels without jargon
- **AI Financial Assistant**: Prominent chat-style interface with user bubbles (right) and AI bubbles (left, cyan accent), typing indicators, expandable source citations
- **Smart Suggestions**: Card-based list with friendly icons, clear benefit statements, "Tell me more" expands AI explanation
- **Investment Actions**: Shadcn Dialog with step-by-step wizard, preview of changes before confirmation, AI explains impact at each step
- **Risk Assessment**: Interactive slider (1-10 scale) with friendly category labels, visual examples of portfolio types, AI explains implications
- **Goals Dashboard**: Card grid with large Progress rings, milestone celebrations, visual countdown to targets
- **Activity Timeline**: Clean vertical timeline with icons, expandable details, filter chips for transaction types
- **Navigation**: Simple top nav with clear sections (Dashboard, Portfolio, Goals, Activity), AI assistant always accessible

**Customizations**:
- Custom AI message bubble with avatar, citation badges that expand inline, copy conversation button
- Custom wealth summary card with animated countup effect for numbers, sparkle accents for growth
- Custom goal card with circular progress, confetti animation when milestones reached
- Custom investment preview component showing before/after comparison with diff highlighting

**States**:
- Buttons: Default with soft shadow, hover scales 102% with deeper shadow, active scales 98%, disabled grays out with tooltip explanation
- Inputs: Default soft border, focus shows cyan glow ring, success state green checkmark, error state shows inline explanation
- Cards: Hover lifts slightly (4px), active presses down, selected shows cyan left border
- AI Panel: Idle with gentle pulse on input, loading shows animated dots, new message slides in from bottom

**Icon Selection** (phosphor-icons):
- TrendUp: Portfolio growth and positive performance
- Target: Goals and objectives
- Sparkle: AI assistant and insights
- Wallet: Account and cash balance
- ChartPie: Asset allocation
- ArrowsClockwise: Rebalancing
- Lightbulb: Smart suggestions
- Clock: Activity history
- ShieldCheck: Risk and security
- Confetti: Celebrations and milestones

**Spacing**:
- Page padding: px-6 py-8 for breathing room
- Card padding: p-6 to p-8 for generous whitespace
- Section gaps: gap-8 for major sections, gap-6 for related cards, gap-4 for form fields
- Table cell padding: px-6 py-4 for comfortable touch targets
- AI message spacing: space-y-4 for conversation flow

**Mobile**:
- Single column layout below 768px
- Wealth cards stack vertically with full-width
- Charts adapt to container, legends move below
- AI assistant takes full screen in modal on mobile with close button
- Navigation becomes bottom tab bar with icons only
- Tables convert to card view with key info visible, tap to expand
- Action buttons become sticky bottom bar
