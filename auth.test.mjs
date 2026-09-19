import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLogin } from './auth.mjs';

test('admin login works', () => {
  assert.deepEqual(validateLogin('admin@btw.com', 'btw@123'), {
    valid: true,
    role: 'admin',
    email: 'admin@btw.com'
  });
});

test('agm login works with AGM password', () => {
  assert.deepEqual(validateLogin('agm@btw.com', 'agm@123'), {
    valid: true,
    role: 'agm',
    email: 'agm@btw.com'
  });
});

test('agm login accepts the shared audit password for convenience', () => {
  assert.deepEqual(validateLogin('agm@btw.com', 'btw@123'), {
    valid: true,
    role: 'agm',
    email: 'agm@btw.com'
  });
});
