'use client';
import React from 'react';
import { Button } from './Button.jsx';
import { ArmutConfig } from '@/lib/config.js';

export function LoadScreen({ label }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p className="eyebrow">{label || 'Loading…'}</p>
    </div>
  );
}

export function ErrorScreen({ error, onRetry, retryLabel }) {
  // Only meaningful in development, where the mock/live switch exists.
  const live = ArmutConfig?.canOverride && ArmutConfig.isLive();
  return (
    <div className="state" role="alert">
      <div className="container container--prose stack">
        <p className="eyebrow" style={{ color: 'var(--danger-dark)' }}>Something went wrong</p>
        <h2 className="display-2">We couldn&apos;t load this page</h2>
        <p className="lede" style={{ marginInline: 'auto' }}>
          {(error && error.message) || 'An unexpected error occurred.'}
        </p>
        {live && (
          <p className="meta">
            You are in live API mode — check that the backend at{' '}
            {ArmutConfig.baseUrl || '(no base URL set)'} is reachable, or switch
            back to mock data using the control at the bottom right.
          </p>
        )}
        <div className="row" style={{ justifyContent: 'center', marginTop: 'var(--space-4)' }}>
          <Button variant="dark" onClick={onRetry}>{retryLabel || 'Try again'}</Button>
        </div>
      </div>
    </div>
  );
}
