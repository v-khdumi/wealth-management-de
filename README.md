# Wealth Management Dashboard

A sophisticated wealth management platform with AI-powered Copilot, bank statement analytics, and personalized financial insights.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.StaticApp)

## 🚀 Quick Deploy to Azure

### Option 1 — One-Click Deploy (Azure Portal)
Click the **Deploy to Azure** button above. You'll need:
- An Azure subscription
- A resource group (or create one)
- Your GitHub repository URL and a [Personal Access Token](https://github.com/settings/tokens) with `repo` scope

### Option 2 — GitHub Actions (Recommended for CI/CD)
1. Create an **Azure Static Web App** in the Azure Portal:
   - Go to [portal.azure.com](https://portal.azure.com) → Create Resource → Static Web App
   - Choose **Free** tier, connect to this GitHub repository, set build preset to **Vite**
   - Copy the **Deployment Token** from the resource overview
2. Add a GitHub secret named `AZURE_STATIC_WEB_APPS_API_TOKEN` with the token value
3. Push to `main` — the `.github/workflows/azure-static-web-apps.yml` workflow deploys automatically

### Option 3 — Azure CLI (Bicep template)
```bash
# Login and set subscription
az login
az account set --subscription "<your-subscription-id>"

# Create resource group
az group create --name wealth-management-rg --location westeurope

# Deploy using Bicep template
az deployment group create \
  --resource-group wealth-management-rg \
  --template-file azure-deploy/main.bicep \
  --parameters appName=wealth-management-dashboard \
               repositoryUrl=https://github.com/v-khdumi/wealth-management-de \
               branch=main \
               repositoryToken=<your-github-pat>
```

### Required Azure Services
| Service | SKU | Purpose |
|---------|-----|---------|
| Azure Static Web Apps | Free / Standard | Host the React SPA |
| (Optional) Azure CDN | Standard Microsoft | Global edge caching |
| (Optional) Azure Monitor | Pay-as-you-go | Application insights |

---

## 🎯 Overview

This is a **production-quality demo application** that illustrates how AI can be thoughtfully integrated into wealth management workflows while maintaining strict grounding, compliance, and transparency standards.

**⚠️ IMPORTANT: This is a DEMO/PLACEHOLDER system. All data is simulated. Not for production use.**

## ✨ Key Features

### For Advisors
- **Dashboard KPIs**: Real-time AUM, client count, alerts, and recommendations
- **Client Management**: Searchable/filterable client list with risk profiles and portfolio values
- **Next Best Actions**: Rule-based recommendations (risk refresh, rebalancing, goal gaps, cash deployment)
- **AI Copilot**: Natural language Q&A about clients grounded in actual demo data
- **Client Profiles**: Comprehensive view of demographics, risk profile, goals, and portfolios
- **Portfolio Analytics**: Asset allocation, drift calculation, model recommendations
- **Paper Trading**: Full order workflow with suitability, cash, and concentration validation
- **Audit Trail**: Complete history of actions and AI interactions

### For Test User (Bank Statement Flow)
- **Bank Statement Upload**: Upload PDF/CSV bank statements — AI extracts transactions automatically
- **AI Copilot Q&A**: Ask natural language questions grounded in your real uploaded statement data
- **Next Best Actions**: Personalized recommendations (risk refresh, rebalancing, liquidity, savings)
- **Spending Analytics**: Interactive charts — monthly income vs. expenses, category breakdown, savings rate
- **Goals Tracking**: Set and track financial goals based on your actual income & savings capacity

### For Clients
- **Portfolio View**: Holdings, allocation charts, performance tracking
- **AI Explanations**: Plain-language explanations of portfolio composition and strategy
- **Goals Tracking**: Visual progress toward retirement, education, and other objectives
- **Order History**: View all trades and their execution details

### AI Features (Grounded & Responsible)
- **Fact Grounding**: AI receives structured "facts packets" - can only reference provided data
- **Source Citations**: Every AI response shows which data points were used
- **Disclaimers**: All AI outputs include "not financial advice / demo" disclaimers
- **Audit Logging**: Every AI interaction logged with prompt, response, model, timestamp
- **Offline Mode**: Graceful degradation to deterministic responses when AI unavailable
- **Temperature Control**: Low temperature (0.2) for consistent, factual responses

## 🏗️ Architecture

**Tech Stack:**
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui components
- Recharts for data visualization
- Spark KV storage (persistent browser storage)
- Spark AI SDK (GPT-4 models, zero-config)
- Phosphor Icons
- Sonner for toast notifications

**Data Model:**
- Users (Advisors & Clients)
- Client Profiles (demographics, segment)
- Risk Profiles (score 1-10, category, staleness tracking)
- Portfolios & Holdings
- Instruments (50 ETFs/stocks with suitability ranges)
- Model Portfolios (6 models: Conservative → Aggressive)
- Goals (Retirement, House, Education, Other)
- Orders (paper trading with full lifecycle)
- Audit Events & AI Interactions

## 🚀 Quick Start

The application is immediately runnable with zero configuration:

```bash
# Already running in Spark environment - just refresh!
```

## 👥 Demo Personas

### Advisors (login as any):
1. **Sarah Chen** - Primary demo advisor with diverse client book
2. **Marcus Williams** - Includes ultra-high-net-worth clients
3. **Elena Rodriguez** - Emerging wealth segment focus

### Featured Demo Clients:
1. **Robert Chen** (cli-1)
   - **Scenario**: Large goal gap
   - Risk: 7/10 (Growth)
   - Portfolio: $1.25M
   - Has retirement goal with $2.15M gap

2. **David Wilson** (cli-3)
   - **Scenario**: Concentrated position risk
   - Risk: 3/10 (Conservative)
   - Portfolio: $450K
   - 45% concentrated in QQQ (tech ETF) - misaligned with risk profile

3. **Jennifer Martinez** (cli-2)
   - **Scenario**: High cash balance
   - Risk: 5/10 (Balanced)
   - Portfolio: $850K
   - 12% in cash, should be deployed

4. **Lisa Anderson** (cli-4)
   - **Scenario**: Aggressive growth profile
   - Risk: 8/10 (Aggressive)
   - Portfolio varies
   - Perfect for testing high-risk instrument suitability

## 📖 10-Minute Demo Script

### Phase 1: Advisor Login & Overview (2 minutes)
1. Select "Advisor Portal"
2. Choose "Sarah Chen"
3. **Point out**: Dashboard KPIs showing $3.3M+ AUM across 4 clients
4. **Highlight**: Active alerts section showing high-priority items
5. **Show**: Next Best Actions - risk profile refresh, goal gaps, rebalancing needs

### Phase 2: Advisor Copilot (2 minutes)
1. **Click** "Summarize my high-priority alerts" in Copilot panel
2. **Observe**: AI generates briefing grounded in actual client data
3. **Show**: Sources used section citing specific data points
4. **Explain**: This is grounded - AI can't hallucinate data not in the system

### Phase 3: Client Deep Dive - Robert Chen (3 minutes)
1. **Click** on Robert Chen from client list
2. **Profile Tab**:
   - Show demographics, risk score 7/10 (Growth)
   - **Goals section**: Point out $2.15M retirement gap
   - **AI Feature**: Click "Explain This Client" - generates advisor briefing
3. **Portfolio Tab**:
   - Show $1.25M total value, asset allocation chart
   - **Point out**: Recommended model (Growth) with 4.2% drift
   - **AI Feature**: Click "Explain My Portfolio" - plain language explanation
4. **Orders Tab**:
   - Click "New Order"
   - Try to buy 100 shares of VTI
   - **Show**: Validation passes (suitable, sufficient cash, no concentration)
   - Submit → watch order execute after 2 seconds
   - **Show**: Holdings updated, cash reduced, transaction logged

### Phase 4: Demonstrate Safeguards - David Wilson (2 minutes)
1. Navigate back to dashboard, select **David Wilson**
2. **Portfolio Tab**:
   - **Point out**: 45% concentrated in QQQ
   - Risk profile: 3/10 (Conservative)
3. **Try to make unsuitable trade**:
   - Orders → New Order
   - Try to buy more QQQ
   - **Show**: Concentration limit warning (would exceed 40%)
4. **Try high-risk instrument**:
   - Try to buy VWO (Emerging Markets)
   - **Show**: Suitability check fails - too risky for Conservative profile

### Phase 5: Client Experience (1 minute)
1. **Logout** and switch to "Client Portal"
2. Choose "Robert Chen"
3. **Show**: Same portfolio view, but client-focused
4. **AI Feature**: Click "Explain My Portfolio"
   - **Point out**: Different tone - educational vs. advisor-focused
   - Includes "not financial advice" disclaimer
5. **Show**: Goals tab with progress bars and gap calculations

## 🔍 Key Features to Highlight

### Business Logic (Rule-Based)
- **Next Best Actions**:
  - Risk profile >180 days old → Refresh recommendation
  - Goal gap >$50k → Increase contribution suggestion
  - Drift >8% → Rebalance recommendation
  - Cash >10% → Investment suggestion
- **Suitability Checks**: Instrument risk range vs. client risk score
- **Concentration Limits**: Single position cannot exceed 40%
- **Cash Sufficiency**: Order cannot exceed available cash

### AI Grounding Pattern
Every AI call follows this pattern:
1. **Build Facts Packet**: Extract only relevant data (client, portfolio, goals, etc.)
2. **System Prompt**: Set role and constraints ("only use provided facts")
3. **Facts Injection**: Pass structured JSON of allowed data points
4. **Response Validation**: Ensure output format is safe
5. **Audit Logging**: Store prompt, response, model, timestamp
6. **Source Citation**: Extract and display which facts were used

### Data Persistence
- All data persists between sessions using Spark KV storage
- Orders execute and update holdings in real-time
- Audit trail is immutable and complete
- Portfolio values recalculate based on current holdings

## 🎨 Design Highlights

- **Bank-Grade Aesthetics**: Deep navy primary, teal accents, professional typography
- **Font Stack**: Space Grotesk (display) + Inter (UI/data)
- **Responsive**: Mobile-optimized with adaptive layouts
- **Accessibility**: WCAG AA contrast ratios, semantic HTML
- **Microinteractions**: Smooth transitions, hover states, loading indicators

## 🧪 Demo Data Summary

- **3 Advisors** managing **12 Clients**
- **6 Model Portfolios** (Conservative, Moderate, Balanced, Growth, Aggressive, Income Focus)
- **15 Instruments** (VTI, BND, VEA, VWO, QQQ, GLD, etc.)
- **200+ Historical Transactions**
- **Multiple goal types** across clients
- **Realistic drift scenarios** for rebalancing demos

## ⚠️ Limitations & Disclaimers

**This is a DEMO application. It intentionally simplifies:**
- **Authentication**: Role/user selection only - no real OAuth
- **Compliance**: Disclaimers are placeholders - not real compliance review
- **Trading**: Paper trading simulation - no real broker integration
- **AI Safety**: Basic content filtering - not production-grade safeguards
- **Performance Calc**: Simplified - missing dividend reinvestment, taxes, fees
- **Market Data**: Static prices - no real-time feeds
- **Risk Assessment**: Demo questionnaire scores - not real psychometric profiling

**Not included (but would be required for production):**
- Multi-factor authentication
- Encryption at rest
- Regulatory reporting (FINRA, SEC, etc.)
- Document generation (account statements, trade confirmations)
- Real broker connectivity
- Tax lot accounting
- Corporate actions handling
- Real-time market data subscriptions

## 🔐 Security & Privacy

**Demo Safeguards:**
- No external API keys required (Spark AI is built-in)
- All data stored locally in browser
- No server-side components
- No PII transmitted outside browser
- AI calls cannot access external data

**Production Requirements (not implemented):**
- End-to-end encryption
- SOC 2 Type II compliance
- Pen testing & vulnerability scanning
- Data residency controls
- GDPR/CCPA compliance workflows

## 🎓 Educational Value

This demo illustrates:
✅ How to ground LLM outputs in structured data
✅ Fact-citation patterns for AI transparency
✅ Rule-based logic + AI augmentation hybrid approach
✅ Complete audit trails for compliance
✅ Progressive disclosure in complex UIs
✅ Suitability and validation patterns for financial products
✅ Dual-persona design (advisor vs. client experiences)

## 📝 License

Demonstration purposes only. Not for production use.

---

**Built with Spark** | A GitHub Innovation Lab Project
