# PROOFMESH AI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every path not explicitly matched is denied for both read and write (`allow read, write: if false;`).
2. **Verified Identity**: All write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Split-Collection PII Isolation**: User email addresses are isolated in `/users/{userId}/private/{docId}` and can only be read or written by the owner (`request.auth.uid == userId`) or a verified administrator.
4. **Privilege Escalation Prevention**: Users creating `/users/{userId}` cannot self-assign `REGULATORY_ADMIN` unless they are the bootstrapped administrator (`mmnaveen202006@gmail.com` with `email_verified == true`) or exist in `/admins/{uid}`. Users cannot mutate `role` or `uid` after creation.
5. **Master Gate Relational Sync**: Subcollection documents `/applications/{applicationId}/observations/{observationId}` must verify the parent `/applications/{applicationId}` exists via `exists()`/`get()` and that the caller is the application owner or an admin.
6. **Terminal State Locking**: Once an `/applications/{applicationId}` record reaches `status == 'Closed'`, non-admin updates are rejected.
7. **Temporal Integrity & Immutable Fields**: `createdAt` must equal `request.time` on `create` and remain unchanged on `update`. `updatedAt` must equal `request.time` on `update`. `ownerUid` and `applicationId` are immutable after creation.
8. **Query Enforcer**: `allow list` on `/applications` requires `resource.data.ownerUid == request.auth.uid || isAdmin()`, preventing blanket collection scraping.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Shadow Field Injection)**: `POST /applications/APP-01` with extra field `isOfficiallyApproved: true`. Rejected by `.keys().hasOnly(...)`.
2. **Payload 2 (Unverified Admin Email Spoof)**: Request with `auth.token.email == 'mmnaveen202006@gmail.com'` and `auth.token.email_verified == false`. Rejected by `email_verified == true` check.
3. **Payload 3 (Self-Assigned Admin Role)**: Regular user creates `/users/u1` with `role: 'REGULATORY_ADMIN'`. Rejected by role creation gate.
4. **Payload 4 (Cross-User PII Read)**: User `u2` performs `get` on `/users/u1/private/info`. Rejected by `isOwner(userId) || isAdmin()`.
5. **Payload 5 (ID Poisoning / 2KB ID)**: Document ID exceeding 128 chars or containing invalid characters (`../`). Rejected by `isValidId()`.
6. **Payload 6 (Value Poisoning on Update)**: Updating `status` on `/applications/APP-01` to a number `12345` or invalid enum `'Hacked'`. Rejected by `isValidApplicationRecord(incoming())` wrapping the update block.
7. **Payload 7 (Terminal State Bypass)**: Updating `/applications/APP-01` when `existing().status == 'Closed'` as a non-admin. Rejected by terminal state lock.
8. **Payload 8 (Owner Hijack on Update)**: Updating `ownerUid` on `/applications/APP-01` to another user's UID. Rejected by `incoming().ownerUid == existing().ownerUid` and `affectedKeys().hasOnly(...)`.
9. **Payload 9 (Client Timestamp Forgery)**: Creating `/applications/APP-01` with backdated `createdAt`. Rejected by `incoming().createdAt == request.time`.
10. **Payload 10 (Orphaned Subcollection Write)**: Creating `/applications/NON_EXISTENT/observations/obs-1` where parent application does not exist. Rejected by parent `exists()` check.
11. **Payload 11 (Blanket List Scraping)**: Listing `/applications` without `where('ownerUid', '==', auth.uid)` as non-admin. Rejected by `resource.data.ownerUid == request.auth.uid`.
12. **Payload 12 (Oversized String Denial-of-Wallet)**: Creating observation with 50,000-character `justification`. Rejected by `justification.size() <= 1000`.
