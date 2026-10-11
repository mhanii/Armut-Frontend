'use client';
import React from 'react';

// Labels are bound to their input with a generated id, so clicking the label
// focuses the field and screen readers announce the two together.
// forwardRef so a form can put focus on the first field that needs attention;
// an error a reader cannot navigate to is only half an error message.
export const Input = React.forwardRef(function Input({
  label, type = 'text', value, onChange, placeholder, required,
  hint, error, id, className = '', ...rest
}, ref) {
  const generated = React.useId();
  const inputId = id || generated;
  // An error supersedes the hint rather than joining it. A hint states the
  // rule so the error never happens; once it has, the error says the same
  // thing with more urgency, and showing both gave the password field "At
  // least 6 characters." in grey directly above "Use at least 6 characters."
  // in red — the same sentence twice, and two announcements for one problem.
  const showHint = hint && !error;
  const describedBy = [showHint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${className}`.trim()}>
      {label && <label className="field__label" htmlFor={inputId}>{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className="field__input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {showHint && <p id={`${inputId}-hint`} className="meta">{hint}</p>}
      {error && <p id={`${inputId}-error`} className="field__error">{error}</p>}
    </div>
  );
});
