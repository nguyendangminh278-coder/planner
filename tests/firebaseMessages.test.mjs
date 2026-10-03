import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authSetupErrors, firebaseError } from '../src/lib/firebaseMessages.js';

test('missing Authentication configuration explains the required Firebase setup', () => {
  assert.match(firebaseError({ code: 'auth/configuration-not-found' }), /Get started/);
  assert.ok(authSetupErrors.has('auth/configuration-not-found'));
});
test('domain, provider and popup failures have distinct recovery instructions', () => {
  assert.match(firebaseError({ code: 'auth/unauthorized-domain' }), /Authorized domains/);
  assert.match(firebaseError({ code: 'auth/operation-not-allowed' }), /Enable/);
  assert.match(firebaseError({ code: 'auth/popup-blocked' }), /popup/);
  assert.ok(!authSetupErrors.has('auth/popup-closed-by-user'));
});
test('database and unknown errors remain readable without exposing raw error details', () => {
  assert.match(firebaseError({ code: 'permission-denied' }), /firestore.rules/);
  assert.equal(firebaseError({ message: 'private credentials', code: 'unknown' }), 'Thao tác chưa thành công. Hãy thử lại.');
});
