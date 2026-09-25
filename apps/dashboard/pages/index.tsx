import { useState } from 'react';
export default function Dashboard() {
  const [env, setEnv] = useState('development');
  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 900, margin: '40px auto', padding: 24, color: '#111' }}>
      <h1>SecMan Dashboard</h1>
      <p>Environment: <b>{env}</b></p>
      <button onClick={() => setEnv('production')}>Switch Env</button>
      <section style={{ marginTop: 32, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2>Secrets (names only)</h2>
        <ul><li>DATABASE_URL — [REDACTED]</li><li>API_KEY — [REDACTED]</li></ul>
        <p style={{ fontSize: 12, color: '#666' }}>Values never displayed for security.</p>
      </section>
    </div>
  );
}
