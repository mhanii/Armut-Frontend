'use client';

// The last resort: an error in the root layout itself, where the app's own
// styles and fonts have not been applied. It therefore carries everything it
// needs inline and stays deliberately plain — reaching this page at all means
// something fundamental is wrong, and it should still read as Armut rather
// than as a stack trace.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f4f0e9', color: '#231d17', padding: '2rem',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}>
        <div style={{ maxWidth: '34rem', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a03c26' }}>
            Something went wrong
          </p>
          <h1 style={{ margin: '0.75rem 0 0', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 400, lineHeight: 1.1 }}>
            Armut is having a moment
          </h1>
          <p style={{ margin: '1rem 0 2rem', fontSize: '1rem', lineHeight: 1.6, color: '#5f564d' }}>
            The site failed to start up properly. This is on our side. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              font: 'inherit', fontWeight: 500, cursor: 'pointer',
              padding: '0.875rem 1.5rem', color: '#ffffff', background: '#231d17',
              border: '1px solid #231d17', borderRadius: '4px',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
