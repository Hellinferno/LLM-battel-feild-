const KEY_PATTERNS = [
  /sk-[A-Za-z0-9_-]{4,}/g,
  /xai-[A-Za-z0-9_-]{4,}/g,
  /AIza[A-Za-z0-9_-]{4,}/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /api[_-]?key["']?\s*[:=]\s*["']?[^"',\s}]+/gi
];

export function redactSecrets(input: unknown): string {
  const text = input instanceof Error ? input.message : String(input ?? "");
  return KEY_PATTERNS.reduce((safe, pattern) => safe.replace(pattern, "[redacted]"), text);
}

export function safeErrorMessage(error: unknown): string {
  const message = redactSecrets(error);
  if (!message || message === "undefined" || message === "null") {
    return "Provider request failed.";
  }
  return message.slice(0, 240);
}
