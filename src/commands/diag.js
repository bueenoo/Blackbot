import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs'; import path from 'path';
const cfg = JSON.parse(fs.readFileSync(path.resolve('./src/config.json'),'utf8'));
function check(ch, client){ const p = ch.permissionsFor(client.user.id); const need=[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.EmbedLinks,PermissionFlagsBits.AttachFiles,PermissionFlagsBits.ReadMessageHistory]; const miss=need.filter(x=>!p?.has(x)); return miss.map(m=>Object.keys(PermissionFlagsBits).find(k=>PermissionFlagsBits[k]===m)||String(m)); }
export const data = new SlashCommandBuilder().setName('diag').setDescription('Diagnóstico de permissões dos canais do bot').setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction){
  const ids = { WL_STAFF: cfg.canalWLStaff, WL_REPROVADA: cfg.canalWLReprovada, TICKETS_OPEN: cfg.canalTicketsOpener, TICKETS_LOG: cfg.logTicketsChannelId, TRANSCRIPTS: cfg.canalTranscripts, PVE_ENTRADA: cfg.canalPVEEntrada, PVE_LOG: cfg.canalPVELog };
  const lines = [];
  for (const [k,id] of Object.entries(ids)) {
    try{ const ch = await interaction.client.channels.fetch(id); const miss=check(ch, interaction.client); lines.push(`**${k}** <#${id}> → missing: ${miss.length?miss.join(', '):'OK'}`); }
    catch(e){ lines.push(`**${k}** <#${id}> → erro: ${e?.code||e?.message}`); }
  }
  await interaction.reply({ content: lines.join('\n'), ephemeral: true });
}
