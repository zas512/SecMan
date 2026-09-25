"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactMessage = redactMessage;
exports.redactLog = redactLog;
// Secret redaction: names-only policy (B) — never expose values
function redactMessage(msg) {
    return msg
        .replace(/([A-Z_][A-Z0-9_]*)=([^\s]{3,})/g, '$1=[REDACTED]')
        .replace(/([A-Z_][A-Z0-9_]*-token|[A-Z_][A-Z0-9_]*-secret)/gi, '[NAMEONLY]');
}
function redactLog(obj) {
    const safe = {};
    for (const [k, v] of Object.entries(obj)) {
        safe[k] = (typeof v === 'string' && /^[A-Z_]/.test(k)) ? '[REDACTED]' : v;
    }
    return safe;
}
//# sourceMappingURL=redact.js.map