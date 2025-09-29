import { isValidSteamId64 } from './validate-steam.js';

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

    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role, 'Cadastro PVE automático por SteamID');
    }

    const logId = cfg.canalPVELog;
    try {
      const logCh = await client.channels.fetch(logId);
      const when = new Date().toISOString().replace('T', ' ').split('.')[0];
      await logCh.send(`🧾 **Registro PVE**\n• SteamID: \`${steamId}\`\n• Discord: ${msg.author.tag} (<@${msg.author.id}>)\n• Data/Hora: ${when}`);
    } catch {}

    await msg.reply(`✅ Cadastro confirmado! Cargo PVE aplicado.\nSteamID registrada: \`${steamId}\``);
  } catch (e) {
    console.error('PVE handler error:', e);
  }
}
