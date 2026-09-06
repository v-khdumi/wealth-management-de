# Modernization architecture

## Scope and status

This is a documentation-only architecture slice for `v-khdumi/wealth-management-de`. It introduces no runtime code, dependencies, configuration, deployment actions, or test files. Existing behavior, credentials, licensing, tests, and security controls remain untouched.

The target is React 19 with TypeScript and Node.js with NestJS, with Azure hosting options described below. All target decisions are **proposed**, pending repository discovery and owner review; these documents do not certify production readiness.

## Decision records

- [ADR 0001: Modular boundaries and incremental migration](adr/0001-modular-boundaries.md)
- [ADR 0002: Azure runtime and trust boundaries](adr/0002-azure-runtime-boundaries.md)

## Evidence and limits

The supplied `package.json` already declares React 19, TypeScript, Vite, and a `packages/*` workspace pattern. It includes `@github/spark`, but that dependency alone does not establish how data is persisted or how the application is hosted.

`src/App.tsx` composes authentication and currency providers and renders `ClientProfile` for the current user. `LoginPage.tsx` selects seeded client personas and explicitly describes a demo. Advisor components exist, but the supplied App does not mount an advisor dashboard; do not introduce new navigation merely because those components exist.

`ClientProfile.tsx` coordinates profile edits, goals, statement processing, budgets, and multiple views through `useDataStore`. `OrdersView.tsx` implements paper trading, including suitability, cash and concentration checks, an order-created audit event, and delayed execution. AI components and local fallbacks already exist. An empty requested `aiFeatures` list means no new AI capabilities, not removal of existing ones.

Implementations of `src/lib`, hooks, application bootstrap, TypeScript/Vite configuration, existing tests, and infrastructure were not supplied. Their absence from this snapshot is not evidence that they are absent from the repository. In particular, storage durability, authentication enforcement, provider credential handling, and existing cloud resources remain unknown.

## First implementation handoff: read-only goals

After discovery, use the existing Goals list as the first candidate end-to-end migration slice. Keep goal creation, contribution updates, milestones, sharing, dependencies, and all other operations on their existing paths until separately verified.

1. Inventory the authoritative store and the complete Goal shape, including optional fields, ordering, initialization, persistence keys, and current error behavior. Record existing behavior with synthetic fixtures before extraction.
2. Frontend Agent: introduce a narrow goals-query adapter backed by the existing store first. Preserve the current list ordering, empty/loading states, currency display, and all callbacks. Do not move the whole application or change the root workspace manifest as part of this adapter.
3. Backend Agent: propose a versioned, authenticated read-only goals contract and a NestJS Goals module using the verified authoritative source. Do not create an empty replacement database or present seeded data as migrated user data. If the source cannot be safely accessed from the server, stop and request a persistence ADR.
4. Frontend and Backend Agents: agree the DTO mapping and authorization model before enabling an HTTP adapter. Retain current optional fields and numerical/date semantics; do not silently normalize financial values.
5. Testing Agent: verify identical results for approved fixtures through the original and adapted paths, including an empty persona and updates made through the retained write path. Cache invalidation or refresh must prevent stale reads after those writes.
6. Enable the HTTP read path only through a separately reviewed, default-off selection mechanism in an approved environment. There must be one authoritative source, no dual writes, and no automatic production fallback to demo data on authorization or network errors.
7. Reverting the read-path selection must restore the original path without losing data. Verify this before expanding migration scope. This change does not implement the selector or perform a rollout.

## Ownership and verification gates

| Owner | Required handoff and evidence |
| --- | --- |
| Architect / Platform | Confirm these documentation paths do not conflict with existing ADRs; review module ownership, unresolved decisions, and links. Keep shared workspace, infrastructure, deployment, and operations changes under Platform ownership. |
| Frontend Agent | Preserve persona login/logout, provider composition, all current tabs, blank-user upload entry, profile editing, dialogs, keyboard interactions, currency selection, AI notices/fallbacks, and exports. Inspect safe rendering in print exports and spreadsheet formula/quoting handling in CSV exports; fixes require separately reviewed changes and regression coverage. |
| Backend Agent | Discover persistence and auth before adding NestJS modules. Preserve financial checks and audit records; specify server-side ownership enforcement, DTO validation, transactions, concurrency, and idempotency before migrating writes. |
| Testing Agent | Own all test implementation. Establish build/lint and existing-test baselines; characterize goals, milestones, sharing, statement statuses, AI success/failure/local fallback, currency/rate failures, paper-order execution and rejection, and export output. Add contract parity and denied cross-user access tests before API activation. |
| Platform / Security | Review Azure identities, least-privilege roles, APIM-to-API reachability, secret boundaries, log redaction, retention, probes, and recovery. Validate in an approved environment only after implementation; no resource creation is authorized by these documents. |

The current build script is `tsc -b --noCheck && vite build`. A successful build would not establish full type safety. Preserve that script here; the responsible agents must inspect the actual TypeScript projects and report a separate type-check baseline rather than weakening checks or claiming the build covers them. The supplied manifest has no test script; discover the repository's actual test tooling instead of assuming one.

Security verification must distinguish characterization from approval: existing demo behavior is not an acceptable authorization boundary for a production API. Use synthetic data, not real bank statements or credentials, in tests and review artifacts. Security gaps must be tracked for remediation, not removed from coverage to obtain parity.

## Decisions still required

- Authoritative storage, backup/restore, data migration, and consistency across retained writes and new reads.
- Production identity provider, session/token model, client/advisor relationships, and any tenant model.
- Money precision, currency conversion policy, rate freshness, and date/time semantics; preserve current outputs until a separate decision approves changes.
- Supported Node.js/NestJS versions compatible with repository tooling; no versions are pinned by this documentation.
- Azure region, service tiers, network topology, data residency, retention, availability objectives, and cost limits.
- Whether statement processing actually needs a worker, durable queue, or object storage. None is assumed to exist or provisioned here.
