import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync(
  fs.existsSync('./firestore.rules') ? './firestore.rules' : './DRAFT_firestore.rules',
  'utf-8'
);

test('Firestore Rules Security Verification — Dirty Dozen & 8 Pillars', () => {
  // 1. Global safety net
  assert.match(rulesContent, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);

  // 2. Email verification enforced on writes
  assert.match(rulesContent, /request\.auth\.token\.email_verified == true/);

  // 3. ID Poisoning guard present
  assert.match(rulesContent, /function isValidId\(id\)/);
  assert.match(rulesContent, /id\.size\(\) <= 128/);

  // 4. Strict key validation with hasAll and hasOnly
  assert.match(rulesContent, /data\.keys\(\)\.hasAll\(/);
  assert.match(rulesContent, /data\.keys\(\)\.hasOnly\(/);

  // 5. Terminal state lock for Closed applications
  assert.match(rulesContent, /existing\(\)\.status != 'Closed'/);

  // 6. Temporal integrity checks against request.time
  assert.match(rulesContent, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesContent, /incoming\(\)\.updatedAt == request\.time/);

  // 7. Split collection PII isolation
  assert.match(rulesContent, /match \/private\/\{docId\}/);

  // 8. Master gate parent check on subcollection
  assert.match(rulesContent, /exists\(\/databases\/\$\(database\)\/documents\/applications\/\$\(applicationId\)\)/);
});
