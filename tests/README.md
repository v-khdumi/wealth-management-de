# Preserved-behavior test slice

## Status and prerequisites

The jsdom suites exercise event handling, data contracts and side effects.
Order tests install a single fake clock before rendering to exercise the two-second
execution boundary deterministically. Visual accessibility and layout require separate real-browser checks.

These tests are proposed characterization checks. Execution results are recorded separately by ModernizeAI; this document does not claim they pass.

The candidate root manifest now defines `npm test` using `tests/vitest.config.mjs` and includes the following development dependencies:

- Vitest 3.2.x, compatible with the supplied Vite 7 line.
- jsdom 27.x.
- @testing-library/react 16.x.
- @testing-library/dom 10.x.

The candidate package-lock.json contains the resolved test dependencies and security updates. Use Node 22.12 or newer. The `baseline-harness.json` file records the additional test tooling used only in the isolated copy of the source commit. The same tests run on both variants; runtime source in the baseline is not rewritten and the source branch is not modified.

The full checkout must contain the source libraries already referenced by the application, including src/lib/utils and the service/context modules. Their implementations were not included in the supplied snapshot. Tests mock service/context boundaries, but module resolution and real UI utility imports must still be verified in the full checkout.

## Run after prerequisite approval

From the repository root:

```sh
node node_modules/vitest/vitest.mjs run --config tests/vitest.config.mjs
```

A targeted run can append a test filename. The configuration is independent of application Vite plugins. It does not start a web server or require Azure credentials. Keep any locally produced runner caches out of the proposed source changes.

## Coverage delivered

| Suite | Coverage |
| --- | --- |
| orders.contract.test.jsx | Required form inputs; missing actor/risk/portfolio guards; suitability, cash and concentration rejections; exact service arguments; pending order and linked audit record; two-second execution; weighted average cost; new holdings; partial/full held-position sells; unaffected other portfolio; transaction linkage; form reset |
| bank-statement-upload.characterization.test.jsx | Advertised picker types; accepted MIME/extension paths; rejected types; exact 10 MiB limit; first-file selection; pending/resolved/rejected callbacks; retry; deletion confirmation and optional deletion capability |
| report-export.contract.test.jsx | Completed-with-data filtering; separate currency totals; JSON schema and zero balance; category percentages; finite zero-income JSON metrics; section toggling; opt-in goals; default CSV structure and filename; in-memory download lifecycle |
| ai-response-renderer.regression.test.jsx | Headings, emoji, list syntax, markdown cleanup, financial token emphasis, grouping, empty content, rerendering, HTML-as-text and non-navigable markdown links |

The renderer suite is component-unit coverage. Orders integrate the real component and Radix controls with a reactive in-memory store adapter. Upload tests exercise real UI event handlers and callback boundaries. Report tests inspect the actual generated content, not a duplicate report implementation. These are consumer contracts, not HTTP provider contracts or full-stack end-to-end tests.

## Isolation and limitations

- Data is synthetic. No production personas, account data, tokens, or keys are required.
- The store adapter supports functional updates and subscriptions but does not emulate persistence, transactions, concurrent clients, or Spark hydration.
- Business-logic checks are mocked. Their invocation and rejection handling are tested; their financial formulas are not.
- Currency discovery, naming and symbols are deterministic doubles in report tests. Exchange-rate fetching and conversion correctness are not covered.
- Network fetch is a failing tripwire. It is not a general network sandbox; run tests in the normal isolated development environment.
- Downloads are intercepted in memory and never saved or printed.
- jsdom does not prove browser layout, focus behavior across every browser, chart rendering, or accessibility compliance.
- No coverage percentage or all-behavior completion claim is made.

## Legacy behavior requiring explicit review

Characterization is evidence of the current implementation, not approval of a production financial rule:

- Orders are paper trades. LIMIT orders execute at their entered price after two seconds without market matching. Sell-side checks currently differ from BUY checks.
- The tests verify an idempotency-key field exists, not server-side deduplication. Repeated submission, concurrent spending, missing instruments during execution, overselling, malformed limit prices and decimal quantity parsing need dedicated review.
- Upload validation uses MIME substrings and CSV/TXT/TSV filename fallbacks. A PDF with an empty MIME type is currently rejected. Server-side content inspection remains necessary.
- CSV exports currently render a zero balance as an empty field, whereas JSON preserves zero. CSV quoting, spreadsheet-formula injection, object-URL revocation, and PDF report HTML escaping need security review and dedicated regression tests alongside approved fixes.
- The response renderer groups list items before paragraphs within each section and strips inline markdown before financial highlighting.

Do not silently loosen tests or encode insecure behavior as a new backend requirement. Approved corrections should retain separate legacy-adapter expectations where compatibility is needed and add explicit corrected-contract tests.

## Remaining handoffs

### Frontend and testing

Extend characterization to App/login/logout and currency propagation; ClientProfile loading, blank-user flows and profile edits; goal creation/templates, adjustments, milestones, sharing, family contributions, dependencies, ranking and notifications; spending alerts and regional budgets; portfolio/insight calculations; all copilot success/failure/offline paths; exchange-rate failures and races; charts and remaining export paths. Add real-browser keyboard, focus, responsive-layout and accessibility regression tests.

Test ClientProfile upload processing through COMPLETED and FAILED state transitions with the real upload component, including alert generation and account scoping. Review cross-user budget/statement aggregation before treating UI filtering as authorization.

### Backend

Provide the NestJS source, agreed OpenAPI/schema contracts, authentication model, persistence adapter and service test entry points before adding provider or HTTP integration tests. Cover unauthenticated and cross-account access, validation, transactional order execution, idempotency/replay, audit durability, upload limits/content scanning, extraction failures, pagination and error responses. Do not invent endpoints from component callback names.

### Platform

Own the shared test-dependency/script handoff. Azure Container Apps, ACR, Key Vault, Managed Identity, API Management and telemetry verification require the actual configuration and an approved isolated test environment. Add identity/secret-boundary, health/readiness, trace-correlation and sensitive-data-redaction tests once those artifacts are available. This slice neither changes deployment configuration nor claims cloud readiness.
