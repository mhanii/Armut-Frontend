'use client';
import React from 'react';
import { Icon } from './Icon.jsx';

// Variants map to modifier classes; hover/active/disabled live in CSS so the
// component never re-renders on pointer movement.
const VARIANT_CLASS = {
  dark: '',
  brand: 'btn--brand',
  clay: 'btn--brand',
  success: 'btn--success',
  danger: 'btn--danger',
  outline: 'btn--outline',
  ghost: 'btn--ghost',
};
const SIZE_CLASS = { sm: 'btn--sm', md: '', lg: 'btn--lg' };

export function Button({
  children, variant = 'dark', size = 'md', icon, disabled, onClick,
  style, type = 'button', fullWidth, className = '', ...rest
}) {
  const classes = ['btn', VARIANT_CLASS[variant] ?? '', SIZE_CLASS[size] ?? '', fullWidth ? 'btn--block' : '', className]
    .filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} style={style} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} aria-hidden="true" />}
      {children}
    </button>
  );
}
