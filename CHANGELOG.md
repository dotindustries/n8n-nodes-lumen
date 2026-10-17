# Changelog

## Unreleased

- Package scaffold created with `@n8n/node-cli`.
- `Lumen API` credential (API key, base URL, optional organization id).
- `Lumen OAuth2 API` credential (authorization code with PKCE).
- `Lumen` node: Request (Create with template picker and form field mapper, Get, Get Many with filters and cursor pagination), Process Template (Get Many, Get Form Schema), Identity (Get Current Actor).
- `Lumen` node: Process Template > Get (`GET /process/{id}`); form field mapper reads choices from `enum`, `oneOf`, `items.enum` and `x-lumen-options` with labels from `x-lumen-enum-labels`; multi-value choice fields accept comma-separated values or arrays and are validated against the allowed values.
- `Lumen Trigger` node: registers a Lumen webhook endpoint on activation (Events multi-select loaded from the API, optional Process Template ID filter), verifies Svix signatures with a 5 minute timestamp tolerance and rejects invalid deliveries with 401.
- CI workflow (lint, build, dependency check) and release workflow (npm publish with provenance on GitHub release).
