# Quick Demo Guide

## 🎬 Opening the Demo

The application launches at the login screen. You'll see two role options:
- **Advisor Portal** (left) - Full wealth management platform
- **Client Portal** (right) - Client-facing view

## 🎯 Best Demo Scenarios

### Scenario 1: Show AI Copilot Grounding (3 min)
**Goal**: Demonstrate how AI is grounded in real data

1. Login as **Advisor** → **Sarah Chen**
2. Dashboard shows 4 clients with $3.3M+ AUM
3. Right panel: **Advisor Copilot**
4. Type: "Summarize my high-priority alerts"
5. **Point out**:
   - AI generates response based on actual client data
   - "Sources Used" section shows data citations
   - Response references specific clients by name and numbers
6. **Explain**: "The AI cannot hallucinate - it only knows what we tell it"

### Scenario 2: Demonstrate Trade Validation (4 min)
**Goal**: Show suitability, concentration, and cash validation

**Part A - Successful Trade:**
1. From dashboard, click **Robert Chen**
2. Portfolio tab → Shows $1.25M portfolio
3. Orders tab → Click "New Order"
4. Buy 50 shares of **VTI** (Total Market ETF)
5. Submit → **All checks pass** ✅
6. Watch order execute in 2 seconds
7. **Show**: Holdings table updates, cash reduced, transaction logged

**Part B - Blocked Trade (Concentration):**
1. Navigate back, select **David Wilson**
2. Portfolio tab → **Point out**: 45% in QQQ (concentrated!)
3. Orders tab → Try to buy MORE QQQ
4. **Show**: Concentration error - would exceed 40% limit ❌

**Part C - Blocked Trade (Suitability):**
1. Same client (David Wilson - Conservative risk 3/10)
2. Try to buy **VWO** (Emerging Markets)
3. **Show**: Suitability error - too risky for Conservative profile ❌

### Scenario 3: Next Best Actions (2 min)
**Goal**: Show rule-based recommendations

1. On dashboard, scroll to "Next Best Actions" section
2. **Point out examples**:
   - "Refresh Risk Profile" - Profile older than 180 days
   - "Increase Contribution" - Goal gap too large
   - "Rebalance Portfolio" - Drift >8% from target
   - "Reduce Concentration Risk" - Single position too large
3. Click any action → navigates to that client
4. **Explain**: "These are rule-based, not AI - deterministic business logic"

### Scenario 4: Client Experience (2 min)
**Goal**: Show client-facing view with AI explanations

1. **Logout** → Switch to **Client Portal**
2. Select **Robert Chen**
3. Shows welcome message and simplified view
4. Portfolio tab → Click **"Explain My Portfolio"**
5. **Point out**:
   - Plain language explanation
   - Educational tone (vs advisor-focused)
   - "Not financial advice" disclaimer
6. Goals tab → Show progress bars and gap calculations
7. **Explain**: "Same data, different presentation for end-user"

## 🔑 Key Talking Points

### AI Grounding & Safety
✅ "Every AI response cites its sources - you can verify the data"
✅ "AI cannot access external data or provide financial advice"
✅ "All interactions are logged to an audit trail for compliance"
✅ "System works offline with deterministic responses if AI unavailable"

### Business Logic
✅ "Suitability checks prevent unsuitable trades before submission"
✅ "Concentration limits protect against portfolio risk"
✅ "Next Best Actions use rule-based logic, not AI guessing"
✅ "Model portfolio recommendations align with risk tolerance"

### Demo Realism
✅ "12 clients with realistic portfolios totaling $9M+ AUM"
✅ "50 real instruments (VTI, BND, QQQ, etc.) with current prices"
✅ "200+ historical transactions showing realistic trading patterns"
✅ "Goals with calculated gaps and required monthly contributions"

## 🎨 Visual Highlights

**Design Features to Point Out:**
- Professional bank-grade color scheme (navy + teal)
- Space Grotesk display font for KPI numbers
- Real-time KPI calculations (not hardcoded)
- Responsive charts with Recharts
- Smooth transitions and micro-interactions
- AI features have distinctive teal accent (AI glow effect)

## ⚡ Quick Troubleshooting

**Issue**: "Order doesn't execute"
→ **Fix**: Wait 2 seconds - simulated delay for realism

**Issue**: "Can't see other clients as client user"
→ **Expected**: Clients only see their own data (RBAC working)

**Issue**: "AI response seems generic"
→ **Expected**: Demo copilot uses simplified responses; click "Explain This Client" or "Explain My Portfolio" for more specific AI

**Issue**: "No data showing"
→ **Fix**: Refresh page - data should seed automatically on first load

## 📊 Demo Data Cheat Sheet

### Clients with Special Scenarios:

**Robert Chen (cli-1)**
- Risk: 7/10 Growth
- AUM: $1.25M
- Issue: ⚠️ $2.15M retirement goal gap
- Best for: Goal planning demos

**David Wilson (cli-3)**
- Risk: 3/10 Conservative  
- AUM: $450K
- Issue: ⚠️ 45% concentrated in QQQ
- Best for: Risk/concentration demos

**Jennifer Martinez (cli-2)**
- Risk: 5/10 Balanced
- AUM: $850K
- Issue: ⚠️ 12% idle cash
- Best for: Cash deployment demos

**Lisa Anderson (cli-4)**
- Risk: 8/10 Aggressive
- AUM: Varies
- Best for: High-risk suitability demos

### Model Portfolios:
1. Conservative (1-3): 20% equity / 65% bonds
2. Moderate (4): 40% equity / 50% bonds
3. Balanced (5): 60% equity / 30% bonds
4. Growth (6-7): 75% equity / 15% bonds
5. Aggressive (8-10): 90% equity / 5% bonds

## 🎤 Sample Questions for Copilot

Try these in the Advisor Copilot panel:
- "Summarize my high-priority alerts"
- "Which clients need risk profile updates?"
- "Show me clients with large goal gaps"
- "Who has the highest concentration risk?"
- "What's my total AUM by risk category?"

---

**Remember**: This is a DEMO. Always mention it's not production software and includes placeholder compliance elements.
