/** Pure helpers for the contact form (kept free of React so they can be unit-tested). */

export type ContactField = 'name' | 'email' | 'message';
export type ContactErrors = Partial<Record<ContactField, string>>;

export interface ContactValues {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

export const MIN_MESSAGE_LENGTH = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  if (!values.name.trim()) errors.name = 'Please enter your name.';
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (values.message.trim().length < MIN_MESSAGE_LENGTH) {
    errors.message = `Please write at least ${MIN_MESSAGE_LENGTH} characters.`;
  }
  return errors;
}

export interface MailtoInput extends ContactValues {
  readonly recipient: string;
  readonly inquiry: string;
}

/** Builds a `mailto:` URL. All user-supplied text is percent-encoded, including line breaks. */
export function buildMailto({ recipient, name, email, inquiry, message }: MailtoInput): string {
  const cleanName = name.trim();
  const subject = `[Portfolio] ${inquiry} — ${cleanName}`;
  const body = `${message.trim()}\n\n— ${cleanName}\n${email.trim()}`;
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
