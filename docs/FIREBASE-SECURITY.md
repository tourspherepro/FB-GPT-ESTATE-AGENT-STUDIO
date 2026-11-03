# Firebase Authentication and Tenant Security

## Status (3 November 2026)
This branch contains **local, un-deployed** security rules and code changes. Do not deploy to Firebase until emulator tests pass and the target production project is selected.

## Key findings
- The imported source referred to an older Firebase project: `studio-291643778-452ce`. The default .firebaserc now uses `demo-estateagent-studio` to prevent accidentally modifying that project.
- Previously any authenticated user could create projects for arbitrary user IDs and edit their own role in Firestore.
- Storage project uploads were publicly readable. Existing Firebase download-token URLs are still potentially accessible even after rules change: rotate/revoke them during migration.
- There are two copies each of Firestore and Storage rules; both copies have been synchronized.
- Platform admin rights now require **Firebase Auth custom claims** `admin: true` or `superadmin: true`; profile data does not grant admin permissions.
- The Outlook command API requires verified custom claims `tenantId: string` and `outlookVoice: true`. The Outlook client is not yet updated to attach a Firebase ID token.

## Tenant model
- Legacy projects: `projects/{projectId}`, scoped to `userId` so that only the owner can access them; the client list query must filter on `userId`.
- New shared-agency projects: `tenants/{tenantId}/projects/{projectId}`; only members in `tenants/{tenantId}/members/{uid}` can read. Membership is provisioned by a platform superadmin or trusted backend.
- Tenant project ownership and membership must be checked by backend APIs too. Firestore rules do not apply to Admin SDK calls.
- `companies` remains a platform-admin-only legacy collection pending migration into tenant records.

## Deployment checklist
1. Choose the Firebase Auth identity provider; confirm whether the existing ANSAOS Authentication project `ansaos-authentication-513401` is to be shared. Do not create duplicate authentication by accident.
2. Configure the correct Firestore and Storage project, region, billing and service credentials; keep `.env.local` private.
3. Provision initial superadmin **using a trusted Admin SDK process** and verify claims refresh.
4. Migrate legacy users, membership and projects to tenant-scoped records where sharing is required.
5. Rotate exposed Firebase Storage download tokens for existing private property images; distinguish published marketing assets from private originals.
6. Run `npm run test:rules` against the Firebase emulators (requires Java 21). GitHub Actions is configured to run the tests.
7. Add integration tests for authenticated logins, invitations, password resets, custom-claim administration and tenant membership changes.
8. Update the Outlook client to send a Firebase ID token; make sure the identity project and tenant claims match.
9. Review the legacy admin user-management UI; role changes are temporarily disabled because Firestore client writes cannot assign secure custom claims.
10. Deploy to a dedicated testing Firebase project first, then review access logs before production rollout.

## Known limitations
- **No live Firebase credentials or projects were modified.**
- Local Windows host did not have Java available; rules emulator tests must be run in CI or a Java-enabled environment.
- Existing published URLs may continue to work using download tokens independently of Storage rules.
- Firebase Auth, storage uploads, subscription role changes and tenant onboarding have not been end-to-end exercised.
