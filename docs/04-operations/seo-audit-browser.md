# Authenticated staging browser acceptance (PR 17)

Status: prepared, not yet executed against staging. A passing unit suite does not
replace this acceptance run. Production remote persistence remains disabled.

The manual `SEO audit authenticated staging browser` workflow starts the real
application on the runner and uses Chromium with three independent password
sessions. It uses the existing iframe bridge, server functions and Supabase RLS.
It neither applies migrations nor changes the deployed application configuration.

## Environment preparation

In GitHub Environment `staging`, retain `STAGING_SUPABASE_PROJECT_REF` and add:

- Secret `STAGING_SUPABASE_PUBLISHABLE_KEY`: the staging `sb_publishable_` key.
- Secret `STAGING_E2E_ACTORS`: JSON in the shape below, entered directly in GitHub.

```json
{
  "a": { "email": "<PM A>", "password": "<secret>", "projectId": "<project A UUID>" },
  "b": { "email": "<PM B>", "password": "<secret>", "projectId": "<project B UUID>" },
  "member": { "email": "<Equipo A>", "password": "<secret>", "projectId": "<project A UUID>" }
}
```

Accounts must be confirmed, active, and able to open the panel. A and B must be
Project Managers in separate tenants with their respective clients assigned.
The member must have the Equipo role, member membership in tenant A and access to
client A. Both projects must be active and use synthetic reserved `.test` domains.
Never use real customer accounts or place passwords in a chat or tracked file.

Existing SQL verifier fixtures roll back and do not establish these persistent
Auth accounts. Account existence has not yet been confirmed. Preparation must be
performed separately in staging before the browser workflow can pass.

## Execution and evidence

Dispatch with `TEST-STAGING-USERS`. The runner refuses a staging reference matching
the tracked production config and injects the same staging URL into browser and
server. No screenshots, traces, storage state or raw exception details are uploaded.

Checks: real sign-in for three users; positive project visibility; absent opposite
project; draft creation through UI for both PMs; persistence after reload; distinct
tenants; rejected cross-tenant transitions in both directions with unchanged state;
member sees a pending audit but cannot authorize; PM can authorize; cancellation.

Successful runs retain two cancelled synthetic audit records with the transition
reason `PR17 synthetic acceptance completed`. They do not DELETE records or claim
ROLLBACK. A failed run can retain drafts or pending records; inspect staging before
rerunning. This test never starts a crawl or moves work into execution.

Still required before enabling remote persistence: run this workflow successfully,
test isolation between assigned/unassigned clients within one tenant, exercise
network failure without local fallback, and review mobile rendering. The current
runner does not claim those cases as covered.
