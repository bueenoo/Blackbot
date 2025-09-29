export function ensureEnv(req=[]) {
  const miss = req.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
  if (miss.length) { console.error('❌ Missing env:', miss); process.exit(1); }
}
