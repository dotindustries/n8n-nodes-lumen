# n8n-nodes-lumen

This is an [n8n](https://n8n.io/) community node package for [Lumen](https://lumen.run). Lumen is the process platform for human-in-the-loop workflows: teams model processes as templates, start requests from them, and complete steps with approvals, forms and automations. This package lets you create and look up Lumen requests, browse process templates and (soon) react to request and step events from inside your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

> Status: pre-release. The package is not yet published to npm and the final npm package name and owner are still to be decided (see [Open points](#open-points)). A Lumen Trigger node for request and step events is being added.

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Development](#development)
- [Publishing](#publishing)
- [Open points](#open-points)
- [Resources](#resources)
- [Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Self-hosted n8n (GUI)

1. Open **Settings > Community Nodes** in your n8n instance.
2. Select **Install**, enter `n8n-nodes-lumen` and confirm that you understand the risks of installing unverified code.
3. After the install finishes, the **Lumen** node appears in the nodes panel.

Community nodes must be enabled on your instance (`N8N_COMMUNITY_PACKAGES_ENABLED=true`, the default for self-hosted installs). Installing community nodes requires owner permissions.

### Self-hosted n8n (manual)

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-lumen
```

Restart n8n afterwards. For Docker set the package name in `N8N_COMMUNITY_PACKAGES` or mount the installed package into `~/.n8n/nodes`.

### n8n Cloud

Only [verified community nodes](https://docs.n8n.io/integrations/community-nodes/installation/verified-install/) can be installed on n8n Cloud. This package is built to meet the verification guidelines (MIT license, no runtime dependencies, published from GitHub Actions with npm provenance) but has not been submitted yet.

## Operations

### Lumen

| Resource | Operation | Description |
|---|---|---|
| Request | Create | Start a new request from a process template. Pick the template from a searchable list (or enter its `prc_...` ID); the node then loads the template's form schema and shows its fields in a mapper with types, required markers and dropdowns for choice fields. Optional template version and JSON metadata. `POST /request`. |
| Request | Get | Get one request by ID (`req_...`) or display code (for example `BREP-42`). `GET /request/{id}`. |
| Request | Get Many | List requests, most recently updated first. Filters: status (multi-select), process template ID, created after, updated after. Return All follows the API cursor; otherwise up to Limit (max 100). `GET /request`. |
| Process Template | Get Many | List process templates, optionally filtered by a search text. Return All or Limit. `GET /process`. |
| Process Template | Get Form Schema | Return the JSON Schema of the form needed to create a request, optionally for a specific version or step. `GET /process/{id}/schema`. |
| Identity | Get Current Actor | Return the user or app the credential authenticates as. `GET /me`. |

Planned: a Lumen Trigger node for request and step webhook events.

The node is marked as usable as a tool, so it can also be attached to an n8n AI Agent.

### Creating a request

1. Add a **Lumen** node, choose **Request > Create** and select a credential.
2. Choose the **Process Template** from the list. The **Form Fields** mapper loads the template's first-step form: required fields are marked, choice fields become dropdowns, booleans toggles and numbers numeric inputs.
3. Fill the fields, or switch the mapper to **Map Automatically** to take values from the incoming item using the field IDs (`prsc_...`) as keys.
4. The node returns `requestId`, `displayName` (the display code) and `workflowId`.

Field IDs in the mapper are Lumen step component IDs. Use **Process Template > Get Form Schema** to inspect them, including the component kind and hints in each property's description.

## Credentials

Both credentials talk to the Lumen public API. The **Base URL** defaults to the production API, `https://api.lumen.run/v1`. For the Lumen staging environment use `https://api-qa.lumen.run/v1`.

Every credential is tested with `GET {Base URL}/me`, which returns the authenticated actor, its organization and granted scopes.

### Lumen API (API key)

1. In Lumen, open **Settings > API** and create an API key. Keys start with `lum-`. Copy the key, it is only shown once.
2. In n8n, create a **Lumen API** credential and paste the key into **API Key**.
3. Leave **Base URL** at the default unless you use staging or a self-hosted Lumen.
4. **Organization ID** is optional. Set it when the key owner is a member of several organizations and you want to pin the organization. It is sent as the `x-lumen-org-id` header.

Requests are authenticated with `Authorization: Bearer <key>`.

### Lumen OAuth2 API

OAuth2 lets each n8n user connect their own Lumen account without sharing API keys. Lumen acts as an OAuth 2.0 authorization server (authorization code grant with PKCE).

1. In n8n, start creating a **Lumen OAuth2 API** credential and copy the **OAuth Redirect URL** that n8n displays. It has the form `https://<your-n8n-host>/rest/oauth2-credential/callback`.
2. In Lumen, open **Settings > Developers**, create an **OAuth application** and add that redirect URL to the application's redirect URIs. Lumen shows a **Client ID** and a **Client Secret**. Copy the secret, it is only shown once.
3. Back in n8n, paste the Client ID and Client Secret into the credential. If you use staging, set **Base URL** to `https://api-qa.lumen.run/v1` and **Auth Base URL** to `https://app-qa.lumen.run/api/auth`. Select **Connect my account**, sign in to Lumen and approve the requested scopes.

The credential requests the scopes `openid offline_access read write`. `offline_access` lets n8n refresh the access token without asking you to sign in again.

Lumen's authorization server is the Lumen app host. The **Auth Base URL** is its issuer; the OAuth endpoints are derived from it:

| Endpoint | Production | Staging |
|---|---|---|
| Issuer (Auth Base URL) | `https://app.lumen.run/api/auth` | `https://app-qa.lumen.run/api/auth` |
| Authorization | `{issuer}/oauth2/authorize` | same |
| Token | `{issuer}/oauth2/token` | same |
| Discovery | `{issuer}/.well-known/openid-configuration` | same |

The same endpoints are also mounted on the API host (`https://api.lumen.run/api/auth/...`), but the discovery document names the app host as the issuer, so the credential uses that.

PKCE (`S256`) is always used. Client credentials are sent in the token request body (`client_secret_post`). Lumen also accepts `client_secret_basic`.

## Compatibility

- Built and tested with n8n 2.x. The package uses the n8n nodes API version 1 and only `n8n-workflow` types; no runtime dependencies.
- Requires Node.js 22 or newer for development. Use whatever Node.js version your n8n release requires at runtime.
- Credential icons require an n8n version that supports credential `icon` properties (n8n 1.0 and newer).

## Development

```bash
npm install
npm run lint      # n8n community node lint rules
npm run build     # compiles to dist/ and copies icons
npm run dev       # starts a local n8n with this package linked, rebuilds on change
```

`npm run dev` installs n8n with npx on first run and stores its data under `~/.n8n-node-cli`. Open the printed editor URL, create a credential and add the Lumen node to a workflow.

To test against a locally running n8n instead, start n8n with `N8N_DEV_RELOAD=true` and run `npm run dev -- --external-n8n`.

## Publishing

Releases are published from GitHub Actions only, with an npm provenance attestation, as required for verified community nodes from May 2026.

1. Bump the version in `package.json` and update `CHANGELOG.md` on `main`.
2. Create a GitHub release whose tag equals the version, for example `0.1.0` (a `v` prefix is also accepted).
3. The `Release` workflow lints, builds, checks that the tag matches the package version and runs `npm publish --provenance --access public`. A second job then runs `npx @n8n/scan-community-package` against the published version.

The workflow needs an `NPM_TOKEN` repository secret: an npm **granular access token** with publish permission for this package, stored under **Settings > Secrets and variables > Actions**. This secret does not exist yet. Once the package exists on npm, you can instead register this repository and `release.yml` as a [trusted publisher](https://docs.npmjs.com/trusted-publishers) on npm and drop the token.

`npx @n8n/scan-community-package` only analyzes packages that are already on npm, so it cannot run on a local build in CI. The `CI` workflow runs the same lint rules the scanner uses (`@n8n/eslint-plugin-community-nodes` via `n8n-node lint`), builds the package and fails if any runtime dependency is declared.

## Open points

- The npm package name `n8n-nodes-lumen` and the npm owner are placeholders. n8n verification requires that the npm author matches the GitHub repository owner. Change `name`, `author` and the scanner's package name in `.github/workflows/release.yml` if the final name differs.
- The `x-lumen-org-id` header for API keys follows the draft public API contract; confirm against the released Lumen public API.
- The OAuth flow has not yet been exercised end to end from n8n against a Lumen OAuth application (no test client was available). The endpoint URLs were verified against Lumen's OpenID discovery documents.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Lumen](https://lumen.run)
- [Lumen public API](https://api.lumen.run)

## Version history

### Unreleased

- Package scaffold with `Lumen API` (API key) and `Lumen OAuth2 API` credentials.
- `Lumen` node: Request (Create, Get, Get Many), Process Template (Get Many, Get Form Schema), Identity (Get Current Actor).
