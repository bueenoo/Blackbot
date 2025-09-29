export function ensureEnv(required = []) {
  const missing = required.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length) {
    console.error('❌ Variáveis de ambiente ausentes:', missing.join(', '));
    process.exit(1);
  }
}

/** Valida SteamID64 (formato comum começando em 7656119 + 10 dígitos) */
export function isValidSteamId64(id) {
  return /^7656119\d{10}$/.test(String(id).trim());
}
