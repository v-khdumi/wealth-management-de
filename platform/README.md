# Cloud readiness slice

This addition packages the existing React/Vite application. It does not migrate application code, replace Spark services, implement NestJS, or authorize a deployment. Existing build scripts, tests, licensing, credentials, and security controls remain unchanged.

## Local validation

From the repository root:

```sh
docker build -f platform/web.Dockerfile -t wealth-web:local .
docker run --rm -p 127.0.0.1:8080:8080 wealth-web:local
```

The full checkout must contain the Vite entry point, configuration, source, and assets. The supplied snapshot only establishes the package scripts. Validate `/healthz`, `/`, deep links, and missing assets. The Docker build uses an existing npm lock file when present; otherwise it installs without writing one. Dependency resolution is not reproducible without an authoritative lock file. Do not manufacture or regenerate one as part of this slice.

Private npm access, if already required, can be supplied locally with BuildKit's `--secret id=npmrc,src=/approved/path/.npmrc`. Never pass credentials as build arguments or copy them into the context. Build scripts can access mounted secrets, so only use trusted source with this option. CI intentionally receives no such credentials.

Environment files are excluded. Vite browser configuration is public and fixed at build time; Container Apps environment variables do not reconfigure this static bundle. Have the frontend owner identify approved public configuration and verify Spark hosting dependencies before publishing. Never inject Key Vault secrets into browser assets.

## Azure foundation

`azure/main.bicep` targets a new, dedicated resource group. Review resource names, policy compliance, supported regions, cost, quotas, and an authorized what-if before any provisioning. This proposal contains no deployment commands or deployment workflow.

Defaults create infrastructure only: ACR, a pull-only web identity, a Container Apps environment, a locked Key Vault, Log Analytics, and workspace-based Application Insights. These resources can incur charges even with no web app. `deployWeb` and `enableApiManagement` default to false.

An approved release process must first provision the foundation, publish a scanned image to its registry, and obtain its immutable digest. Enabling `deployWeb` requires `imageDigest` to be exactly 64 hexadecimal characters without the `sha256:` prefix and `imageRepository` to match that image. Review these parameters before submission; template compilation does not enforce their conditional relationship. Allow for role-assignment propagation before image pulls. Preserve the previous approved digest for rollback review.

Web ingress defaults to internal. `enablePublicWebIngress` is an explicit exposure decision, not authentication. Do not enable it until the application's existing authentication and authorization are verified in this hosting environment. Internal ingress limits Container Apps environment access but is not a substitute for a VNet/private-endpoint architecture.

ACR Basic uses its authenticated public endpoint with admin credentials disabled. Private registry networking requires a separately reviewed SKU and network design. The web identity has only AcrPull at this registry. It has no Key Vault or subscription-wide rights.

Key Vault has RBAC, purge protection, 90-day soft-delete retention, and public access disabled. It is intentionally unusable for application secret reads until private endpoint/DNS connectivity and narrowly scoped consumer grants are approved. No secrets or credentials are created or output. Use a separate identity for any future API or worker rather than expanding the web identity's permissions.

The optional API Management Consumption resource is an empty foundation and requires a valid publisher email and regional availability. It has no APIs, backend connections, or token-validation policies. Consumption does not provide a private VNet backend path for this design. The API owner must choose the appropriate tier/network topology, define NestJS contracts, configure JWT issuer/audience validation and rate limits, and prevent backend bypass before exposing any operation. A subscription key alone is not user authentication.

## Observability and privacy

Container stdout/stderr are collected by Log Analytics with 30-day retention. Nginx access logs omit client addresses, paths, queries, bodies, and authorization headers. Error logs can still contain request context: verify their content and set an approved access/retention policy before processing sensitive data.

Application Insights is provisioned but not instrumented. Local/key-only ingestion is disabled. Backend owners must select a supported authenticated Azure Monitor/OpenTelemetry integration and request only the necessary monitoring role for their own managed identity. Browser telemetry requires a separate privacy and ingestion-authentication design. Do not treat an Application Insights resource as proof that traces, dependencies, dashboards, or alerts exist.

## CI and release handoff

The added workflow only compiles Bicep and builds a local image. It does not publish, authenticate to Azure, create CI secrets, or deploy. Existing quality and security gates remain authoritative. Pin reviewed base-image digests and tool versions in a follow-up supply-chain review; the initial version tags are not immutable. Image scanning, SBOM review, and provenance verification must gate an eventual release.

A future release workflow requires a separately approved GitHub environment with reviewers and an OIDC federated subject restricted to this repository and that environment. Grant `id-token: write` only to the trusted release job, never to pull-request validation. Separate image publication from infrastructure administration: use registry-scoped AcrPush for the publisher, and a reviewed custom deployment role limited to the target resources for the deployer. Runtime identities must not push images. Role assignments require separate authorized administration; do not grant routine release jobs Owner or User Access Administrator. Do not introduce stored Azure client secrets.

## Required verification and ownership

- Testing Agent: container health and non-root execution, SPA routes, assets, caching, error handling, and full existing UI/Spark regression coverage. No new test files are included here.
- Platform reviewers: Bicep compilation, authorized validation/what-if, RBAC denial checks, private vault access denial, image-pull identity behavior, HTTPS exposure, log privacy, resource costs, and digest-based rollback rehearsal in a disposable environment.
- Frontend owner: supported standalone hosting, existing authentication, approved public build configuration, and browser telemetry decisions.
- Backend owner: NestJS service and worker contracts, health endpoints, identity-aware secret access, authenticated telemetry, and API authorization. No backend is assumed to exist in this snapshot.

None of these checks have been executed by this proposal.
