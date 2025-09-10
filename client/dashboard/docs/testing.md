# Testing Strategy

The testing strategy for the dashboard prototype aims to ensure reliability, maintainability, and performance. Since it's a UI heavy project, E2E testing is a key to ensure trust while iterating on the dashboard.

## E2E Testing

### Currently

We're using Calypso's existing infrastructure, which separates the actual tests (`specs`) from so-called "page objects" (and optionally "components"). The latter represent pages (e.g. `DashboardPage`) with specific methods for interaction and inspection:

- test/e2e/specs/dashboard/
- packages/calypso-e2e/src/lib/pages/dashboard-page.ts

The setup itself lacks centralised documentation, IMO, particularly around decrypting the secrets necessary to letting Playwright run Calypso. What we get in return is a system that has already solved many problems (user authentication, etc.).

### Next

Consider a lighter, less abstracted way of writing tests, without page objects. I don't think the new dashboard justifies the added complexity.
