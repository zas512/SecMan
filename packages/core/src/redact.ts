// Secret redaction: names-only policy (B) — never expose values
export function redactMessage(msg: string): string {
  return msg
    .replace(/([A-Z_][A-Z0-9_]*)=([^\s]{3,})/g, '$1=[REDACTED]')
    .replace(/([A-Z_][A-Z0-9_]*-token|[A-Z_][A-Z0-9_]*-secret)/gi, '[NAMEONLY]');
}
export function redactLog(obj: Record<string, any>): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    safe[k] = (typeof v === 'string' && /^[A-Z_]/.test(k)) ? '[REDACTED]' : v;
  }
  return safe;
}
