# ADR 0001: Modular boundaries and incremental migration

- Status: Proposed
- Scope: Shared application architecture; no runtime changes
- Related: [Architecture overview](../README.md), [Azure boundaries](0002-azure-runtime-boundaries.md)

## Context

The supplied application already uses React 19 and TypeScript. Components frequently read and mutate shared collections through `useDataStore`, while `ClientProfile` coordinates several business capabilities. Some calculations live in imported business utilities; others are inline in components. Moving files alone would not isolate responsibilities or establish server-side security.

The requested backend target is NestJS. The supplied snapshot does not establish an existing server, persistence implementation, or production identity system. A whole-application rewrite or immediate microservice split would risk changing demo flows, financial calculations, and data semantics without sufficient evidence.

## Decision

Retain the existing React/Vite application in place. Introduce logical capability boundaries through adapters and explicit use cases, one verified flow at a time. Target a NestJS modular monolith for server-side capabilities, with a separate worker process only when a measured processing need and durable job design justify it.

The boundaries below are a target ownership map, not a claim that these modules or folders already exist. Imported library implementations must be inspected before extraction.

| Boundary | Existing evidence | Target responsibility and public surface |
| --- | --- | --- |
| Application shell / UI | `App.tsx`, `ClientProfile.tsx`, `components/ui` | Provider composition, navigation, dialogs, presentation and feedback. Feature components call use-case adapters; generic UI primitives remain free of business services. |
| Identity and client access | `LoginPage.tsx`, `useAuth`, advisor-client filtering | Demo identity compatibility plus a separately approved production principal and access policy. Expose current-principal and authorize-client operations; a caller-supplied client ID is never proof of permission. |
| Client profiles and risk | Profile editing and risk displays in `ClientProfile` | Own profile and risk records; expose reads, profile updates, and risk queries. Risk refresh behavior must be discovered rather than invented from a button label. |
| Goals | Goal dialogs, analytics, dependencies, sharing and milestone handlers | Own goals and embedded goal state: contributions, progress history, milestones, family members, sharing, dependencies, priorities and optimizations where supported. Expose named queries and commands rather than unrestricted collection setters. |
| Portfolio and paper trading | `PortfolioView.tsx`, `MultiCurrencyPortfolio.tsx`, `OrdersView.tsx` | Own portfolios, holdings, cash/currency accounts, orders and execution transactions. Keep order creation and execution consistency within this boundary. Suitability consumes risk queries; instrument/model data is read through a reference-data surface. No real brokerage integration. |
| Statements | `BankStatementUpload.tsx`, processing calls in `ClientProfile` | Own statement metadata, extraction results and processing lifecycle. Expose upload, read, process and delete use cases while preserving visible states and confirmations. File persistence and processor adapters require discovery. |
| Budgets and spending alerts | `RegionalBudgets.tsx`, `SpendingAlertsPanel.tsx` | Own regional/category budgets and alerts; consume statement queries and expose budget commands and alert dismissal. Category budgets shown in the snapshot do not carry explicit user ownership; resolve this before exposing them through a multi-user API. |
| Currency / reference data | Currency contexts, currency utilities, instruments and model portfolios | Provide explicit rates, conversion and reference-data queries. Display preference remains UI state unless current persistence establishes otherwise. Do not conflate changing a symbol with converting an amount or standardize current calculations during extraction. |
| Insights and existing AI | Assistants, `InsightsDashboard`, AI/provider imports | Orchestrate authorized reads, existing deterministic recommendations, provider calls and local fallbacks. Own AI interaction history. Recommendations do not directly mutate goals or portfolios; confirmed actions use their owning module's commands. |
| Reporting | CSV/JSON exports and browser print reports | Produce read-only projections from authorized module queries; preserve available formats, sections, ordering and notices. Reporting does not own duplicate financial records. |
| Audit | `setAuditEvents` in `OrdersView` | Preserve existing audit events and expose a narrow append operation. Business operations decide which events are required; telemetry is not a substitute for the audit record. |

## Dependency rules

1. UI features depend on use-case adapters and transport-neutral contracts, not NestJS controllers, server entities, cloud SDKs, or credentials. Existing imports remain until their individual migrations are approved.
2. NestJS controllers validate transport input and invoke application services. Application services enforce authorization and coordinate domain operations. Domain calculations do not depend on React, NestJS decorators, HTTP, or Azure SDKs.
3. Domain/application code declares repository and provider ports. Infrastructure adapters implement those ports; the composition root supplies them. No shared global service locator or cross-module collection access is introduced.
4. Modules communicate through explicitly exported query/command interfaces. Consumers may not import another module's internal repository or mutate its records. Cross-capability workflows belong in an application orchestrator, avoiding circular dependencies.
5. The paper-trading application service coordinates portfolio, holdings, order, transaction and required audit changes through a transaction-capable persistence boundary before any server-side write migration. Do not replace the current flow with independent best-effort writes. Retry and idempotency semantics require tests; the presence of an `idempotencyKey` field alone does not establish enforcement.
6. Shared contracts contain only reviewed DTO/schema definitions and serialization rules. They do not export React hooks, NestJS modules, storage entities, provider clients or secrets. Existing `src/lib/types` is not automatically a public API contract.
7. Keep shared packages small and introduce them only with real consumers. The existing `packages/*` declaration is not authorization to relocate the root app or create an unverified workspace layout.

These rules are initially review requirements. No lint rule or build restriction is added until actual import graphs, aliases, and existing violations are inventoried. Future automated checks must preserve existing checks and explicitly distinguish grandfathered imports from new violations.

## Compatibility and first slice

Start with the read-only goals adapter described in the architecture overview. A future HTTP contract should be versioned and documented with explicit field, ordering, null/optional, error and authorization semantics. Contract/schema implementation belongs to the responsible implementation agents after discovery.

Do not reinterpret persisted IDs, dates, number precision, currencies, enum values, demo simulations, or fallback behavior as part of modularization. Characterize differences between current views instead of silently consolidating their calculations. No dual-write or automatic user-data migration is approved.

Preserve existing persona login and offline/demo paths in their intended environment. A production API must independently verify identity and ownership; it must not accept a seeded persona or browser collection filter as authorization. Security improvements and behavior corrections require explicit review and coverage, not concealment within a refactor.

## Alternatives considered

- **Rewrite into a new frontend/backend workspace:** rejected for this slice because source and persistence discovery are incomplete and it would touch unrelated behavior.
- **Microservice per capability:** deferred because distributed transactions, network failures and operational cost are unjustified by the available evidence.
- **Expose the whole data store over HTTP:** rejected because it couples clients to storage internals and risks broad unauthorized access.
- **Keep all business logic in components indefinitely:** rejected as a target because it obstructs independent verification and server-side enforcement; retained temporarily for compatibility.

## Consequences and acceptance

Adapters add temporary indirection and may coexist with legacy access. This is deliberate and reversible. Each migrated flow must demonstrate behavior parity, secure ownership enforcement and a working return to the original path before migration expands.

Required evidence includes original-versus-adapter goal results, retained-write/read consistency, malformed-contract rejection, cross-user access denial, and import-boundary review. Later write slices additionally require concurrent update, idempotency, transaction failure and audit preservation tests. The Testing Agent owns test files; this ADR creates none.
