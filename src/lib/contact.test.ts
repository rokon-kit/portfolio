import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMailto, validateContact } from './contact.ts';

describe('validateContact', () => {
  it('accepts a complete, valid message', () => {
    const errors = validateContact({ name: 'Jane Doe', email: 'jane@company.com', message: 'Hello, I would like to talk.' });
    assert.deepEqual(errors, {});
  });

  it('flags every empty field', () => {
    const errors = validateContact({ name: '  ', email: '', message: '' });
    assert.deepEqual(Object.keys(errors).sort(), ['email', 'message', 'name']);
  });

  it('rejects malformed email addresses', () => {
    for (const email of ['jane', 'jane@', '@company.com', 'jane@company', 'ja ne@company.com']) {
      const errors = validateContact({ name: 'Jane', email, message: 'A long enough message.' });
      assert.ok(errors.email, `expected "${email}" to be rejected`);
    }
  });

  it('rejects messages shorter than the minimum after trimming', () => {
    const errors = validateContact({ name: 'Jane', email: 'jane@company.com', message: '   short   ' });
    assert.ok(errors.message);
  });
});

describe('buildMailto', () => {
  const base = {
    recipient: 'someone@example.com',
    name: 'Jane Doe',
    email: 'jane@company.com',
    inquiry: 'Project collaboration',
    message: 'Hi there.\nLet us talk.',
  };

  it('targets the recipient and carries a subject and body', () => {
    const url = buildMailto(base);
    assert.ok(url.startsWith('mailto:someone@example.com?subject='));
    assert.ok(url.includes('&body='));
  });

  it('round-trips user text exactly through percent-encoding', () => {
    const url = new URL(buildMailto(base));
    assert.equal(url.searchParams.get('subject'), '[Portfolio] Project collaboration — Jane Doe');
    assert.equal(url.searchParams.get('body'), 'Hi there.\nLet us talk.\n\n— Jane Doe\njane@company.com');
  });

  it('neutralises characters that could inject extra mailto fields or headers', () => {
    const url = buildMailto({
      ...base,
      name: 'Eve&cc=victim@example.com',
      message: 'line1\r\nBcc: victim@example.com & #fragment',
    });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('cc'), null);
    assert.equal(parsed.searchParams.get('bcc'), null);
    assert.ok(!url.includes('\n') && !url.includes('\r'));
    assert.ok(parsed.searchParams.get('body')?.includes('Bcc: victim@example.com & #fragment'));
  });

  it('encodes non-ASCII names', () => {
    const url = new URL(buildMailto({ ...base, name: 'রকন' }));
    assert.ok(url.searchParams.get('subject')?.endsWith('— রকন'));
  });
});
