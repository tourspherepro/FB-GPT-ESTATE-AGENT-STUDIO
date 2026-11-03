# Estate Agent Studio — Repair Progress

## Phase 1: Foundation (2026-11-03)

- Branch: `fix/foundation` (original `main` retained unchanged until reviewed/merged).
- Runtime: Node.js 22 (`.nvmrc`). Global Windows Node selection was not changed.
- Repaired missing React component imports and incorrect Tabs import.
- Corrected null handling, checkbox values, Firestore update data, and property option types.
- Replaced older Genkit response handling and updated flow invocation signatures.
- Installed `firebase-admin` dependency.
- Moved Outlook Voice Firebase Admin initialization into the request handler so builds work without credentials; added Firebase ID-token verification, payload validation, and non-disclosing server errors. Agency-level permission checks remain for Phase 2.
- Enabled TypeScript and lint checking during builds rather than ignoring errors.
- `npm run typecheck`: passed.
- `npm run build` (Node 22.21.1, Next.js 15.5.15): passed. 31 static pages generated.

## Remaining work and known limitations

- Firebase client configuration, Firebase Admin service credentials and Gemini API key still need configuring in local private environment variables; secrets should not be committed.
- AI integrations and authentication flows have not been end-to-end tested against live services.
- EA360 and full-screen tour still use a placeholder panorama rather than a real textured 360 viewer.
- The caller booking tool is a mock and does not book appointments in a real calendar.
- Outlook Voice endpoint now requires `Authorization: Bearer <Firebase ID token>`. The Outlook client must be updated to send tokens. Additional tenant and role authorisation remains required before production exposure.
- Feature-level smoke tests, tenant isolation, CI and environment deployment are pending.

## Phase 2

Audit Firebase configuration and permissions; implement tenant and role isolation and test auth flows before exposing customer data or service endpoints.
