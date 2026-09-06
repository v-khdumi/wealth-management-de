# ADR 0002: Azure runtime and trust boundaries

- Status: Proposed
- Scope: Target hosting and operations architecture; no provisioning
- Related: [Modular boundaries](0001-modular-boundaries.md), [Architecture overview](../README.md)

## Context

The requested cloud options are Azure Container Apps, Azure Container Registry, Azure Key Vault, Managed Identity, Application Insights, Log Analytics, and Azure API Management. Selecting these services does not demonstrate that current Spark integrations, browser persistence, or provider calls are portable to a container.

No infrastructure, subscription configuration, production identity provider, storage implementation, or operational objectives were supplied. The current persona login is explicitly a demo. Cloud hosting must not turn that persona selector into access to production financial records.

## Decision

Use the selected services as the target platform envelope, with separate web and API runtime responsibilities. Defer deployment definitions until the missing runtime and security prerequisites are resolved. Domain modules from ADR 0001 are logical boundaries, not individual Azure services.

| Service | Target responsibility | Constraint |
| --- | --- | --- |
| Azure Container Apps: web | Serve the compiled React application through a production static-file server | Do not use the Vite development/preview server as the production runtime. Verify asset routing, SPA fallback and required host integrations before packaging. No server secrets in browser assets. |
| Azure Container Apps: API | Run the NestJS modular monolith | Protect business endpoints with verified identity, client-level authorization and DTO validation. Keep request handling stateless; local container files and memory are not durable financial storage. |
| Azure Container Apps: worker, if justified | Run approved long-running statement processing outside request handling | No public ingress. Require a durable job source, bounded retries, idempotent processing, failure handling and authorized result access before enabling workers. Do not use fire-and-forget tasks or browser timers as durable scheduling. |
| Azure Container Registry | Store approved web/API/worker images | Use immutable image references and least-privilege pull identities. No registry passwords or image artifacts are added by this change. Build identity and runtime identities are separate concerns. |
| Azure API Management | Public API entry point, version routing, request limits and token validation | Preserve end-user identity to the API. Gateway validation does not replace backend ownership checks. Disable sensitive payload logging and avoid caching personalized responses by default. |
| Azure Key Vault | Hold server-side secrets and certificates where needed | Runtime access uses managed identity and minimum necessary permissions. Never copy secrets into source, frontend environment variables, image layers, build arguments, documentation or logs. |
| Managed Identity | Authenticate Azure workloads to approved Azure resources | Use separate least-privilege identities for API and worker; the static web workload needs no financial-data access. Managed identity is not end-user authentication. |
| Application Insights | Application traces, dependency timing, errors and operational metrics | Use structured, allowlisted metadata. Exclude bank contents, prompts/responses, names, email addresses, tokens and secret values from routine telemetry. |
| Log Analytics | Central operational log collection and querying | Define access controls, retention, residency, cost limits and redaction for application, gateway and container logs. It is not the authoritative store for financial records or business audits. |

## Target request and trust flow

1. The browser loads public application assets from the web workload. Public configuration may contain an approved API URL, never a credential. Existing host integrations must be inventoried before changing the hosting context.
2. A separately approved production identity flow establishes the user principal. The browser invokes APIM over HTTPS using that flow. Preserve the demo application separately; do not implicitly map a selected seed user to a production identity.
3. APIM validates the approved token issuer, audience and expiry and applies bounded request policies. The API independently validates the end-user identity and checks authorization for each client-owned resource.
4. Prefer private API reachability from APIM so callers cannot bypass gateway policies. Confirm the selected APIM tier, Container Apps environment, DNS and network integration support the design before implementation. Internal ingress alone does not prove APIM can connect. Any alternative topology requires a reviewed decision and equivalent origin protection.
5. API/worker identities access only their approved stores and provider adapters. Users never receive direct Key Vault or registry access. Provider responses and uploaded files remain untrusted input.
6. Propagate a bounded correlation identifier through gateway, API and any approved job flow. Do not use financial values or user identifiers as metric dimensions, URLs or correlation IDs.

The future API must validate upload size and content independently of the browser's existing 10 MiB check. Gateway and server limits must allow the supported file size plus transport overhead while remaining bounded. Content validation, scanning/quarantine, timeout behavior and safe export rendering need separate implementation and tests. Existing frontend validation and safe React-based AI response rendering remain in place.

## Existing AI and credentials

Preserve existing AI functionality, demos, notices and local fallbacks. Do not add new models or AI features. Inspect current provider implementations and credential sources before proposing a server-side adapter. If a migration is approved, keep provider credentials server-side and use managed identity where supported; use Key Vault for necessary secrets otherwise. Do not delete or rotate existing credentials as a side effect of architecture work.

Provider failure may use a characterized educational fallback where the current feature supports one. Authentication or authorization failure must never be bypassed by a fallback that exposes protected data. Prompts and AI interaction history are sensitive application data, not routine telemetry.

## Operational gates

- Define liveness and readiness independently: liveness must not restart healthy processes merely because an external AI/rate provider is unavailable; readiness reflects dependencies required for the enabled slice. Health responses disclose no secrets or financial data.
- Validate graceful shutdown, bounded requests and retries, cancellation, resource limits and scaling using representative synthetic workloads. Do not guess production sizing or availability objectives.
- Establish data durability, backup/restore, encryption and ownership before any write migration. Database, object storage and queue selections require a follow-up ADR; Container Apps, Key Vault and Log Analytics do not fill those roles.
- Preserve existing audit history and retention controls. Define durable audit handling with write transactions before moving paper trading to the server.
- Keep deployments and traffic changes behind existing approval controls. A future rollback plan must address both application revisions and data compatibility; routing to an older revision is insufficient after incompatible writes.

## Alternatives and consequences

Direct browser access to protected provider credentials and an anonymously accessible backend are rejected as production targets. Combining static hosting and all API/worker permissions into one workload is deferred because it unnecessarily broadens the trust boundary. Creating every selected Azure resource immediately is rejected because it would imply deployment readiness without authoritative storage, identity, networking and cost decisions.

The proposed split adds gateway/networking and identity configuration work but keeps business modules together and permits incremental adoption. There is no deployment-ready claim in this ADR.

## Verification required before activation

Platform and Security owners must verify APIM-to-API connectivity, denial of direct-origin bypass, TLS, token validation, restrictive CORS, and CSRF protection if the chosen session model uses cookies. Verify unauthorized and cross-user reads are denied by the API even when gateway checks are bypassed in an isolated test harness.

Verify each managed identity can access only required resources and cannot read unrelated secrets. Inspect compiled frontend assets, container configuration, APIM diagnostics, application traces and container logs for credential and personal-data leakage. Exercise provider outages, rate limits, readiness, shutdown and rollback. If a worker is later added, verify duplicate delivery, retry exhaustion, restart recovery and ownership of results. Testing Agent owns test implementation; Platform owns environment configuration. No commands, tests, builds or deployments have been executed by this change.
