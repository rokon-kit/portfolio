'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { inquiryOptions } from '@/content/contact';
import { buildMailto, validateContact, type ContactErrors } from '@/lib/contact';

interface ContactFormProps {
  /** Recipient of the composed message. */
  readonly recipient: string;
}

/**
 * Message form that hands off to the visitor's own email app (`mailto:`).
 * There is no backend yet (Milestone 7), so this is deliberately honest about it:
 * nothing is transmitted or stored by this site.
 */
export function ContactForm({ recipient }: ContactFormProps) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [prepared, setPrepared] = useState(false);

  const id = (field: string) => `${uid}-${field}`;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    const found = validateContact(values);
    setErrors(found);
    setPrepared(false);

    const firstInvalid = (['name', 'email', 'message'] as const).find((field) => found[field]);
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    window.location.href = buildMailto({
      recipient,
      ...values,
      inquiry: String(data.get('inquiry') ?? ''),
    });
    setPrepared(true);
  }

  return (
    <form className="blueprint-form" ref={formRef} onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={id('name')} className="form-label">
            SENDER NAME <span className="req" aria-hidden="true">*</span>
          </label>
          <input
            id={id('name')}
            name="name"
            type="text"
            className="form-input"
            placeholder="e.g. Jane Doe"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? id('name-error') : undefined}
          />
          {errors.name && (
            <span className="form-error" id={id('name-error')}>
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={id('email')} className="form-label">
            WORK EMAIL <span className="req" aria-hidden="true">*</span>
          </label>
          <input
            id={id('email')}
            name="email"
            type="email"
            className="form-input"
            placeholder="jane@company.com"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? id('email-error') : undefined}
          />
          {errors.email && (
            <span className="form-error" id={id('email-error')}>
              {errors.email}
            </span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={id('inquiry')} className="form-label">
          PURPOSE / INQUIRY TYPE
        </label>
        <select id={id('inquiry')} name="inquiry" className="form-select" defaultValue={inquiryOptions[0]?.value}>
          {inquiryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor={id('message')} className="form-label">
          TRANSMISSION CONTENT <span className="req" aria-hidden="true">*</span>
        </label>
        <textarea
          id={id('message')}
          name="message"
          rows={5}
          className="form-textarea"
          placeholder="Detail your project requirements, team context, or engineering challenge..."
          required
          aria-required="true"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? id('message-error') : undefined}
        />
        {errors.message && (
          <span className="form-error" id={id('message-error')}>
            {errors.message}
          </span>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit-transmission">
          <span className="btn-label">TRANSMIT VIA EMAIL</span>
          <span className="btn-arrow" aria-hidden="true">→</span>
        </button>
        <span className="form-disclaimer">
          This opens your email app with the message ready to send. Nothing is stored on this site.
        </span>
      </div>

      <p className="form-note" role="status">
        {prepared &&
          `Your email app should now be open with the message prepared. If nothing opened, write to ${recipient} directly.`}
      </p>
    </form>
  );
}
