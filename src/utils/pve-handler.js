import { isValidSteamId64 } from './validate.js';

/**
 * Handler para cadastro PVE:
 * - Lê mensagens no canal configurado (texto simples com SteamID64)
 * - Dá o cargo PVE ao autor
 * - Loga no canal de logs com SteamID, nome, data/hora
 */
export async function handlePVEMessage(client, msg, cfg) {
  try {
    if (msg.author.bot) return;
    if (!cfg?.canalPVEEntrada) return;
    if (msg.channelId !== cfg.canalPVEEntrada) return;

    const steamId = msg.content.trim();
    if (!isValidSteamId64(steamId)) {
      await msg.reply('❌ SteamID inválida. Envie algo como `7656119XXXXXXXXXX` (17 dígitos).');
      return;
    }

    const guild = msg.guild;
    if (!guild) return;

    const member = await guild.members.fetch(msg.author.id);
    const roleId = cfg.cargoPVE;
    const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId);
    if (!role) {
      await msg.reply('⚠️ Cargo PVE não foi encontrado. Avise a administração.');
      return;
    }

    // Evitar duplicado
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role, 'Cadastro PVE automático por SteamID');
    }

    // Log
    const logId = cfg.canalPVELog;
    try {
      const logCh = await client.channels.fetch(logId);
      const when = new Date().toISOString().replace('T', ' ').split('.')[0];
      await logCh.send(`🧾 **Registro PVE**
• SteamID: \`${steamId}\`
• Discord: ${msg.author.tag} (<@${msg.author.id}>)
• Data/Hora: ${when}`);
    } catch {}

    await msg.reply(`✅ Cadastro confirmado! Cargo PVE aplicado.
SteamID registrada: \`${steamId}\``);

  } catch (e) {
    console.error('PVE handler error:', e);
  }
}
