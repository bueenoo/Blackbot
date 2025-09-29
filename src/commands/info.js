import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const cfg = JSON.parse(fs.readFileSync(path.resolve('./src/config.json'), 'utf8'));

const PVE_HOST = '189.127.165.165';
const PVE_PORT = '2382';
const RP_STATUS = 'Offline — em construção';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Mostra IPs dos servidores e status.');

export async function execute(interaction) {
  if (interaction.channelId !== cfg.allowedInfoChannel) {
    return interaction.reply({
      content: `Use este comando no canal <#${cfg.allowedInfoChannel}>.`,
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle('Black • Status dos Servidores')
    .addFields(
      { name: 'RP', value: RP_STATUS, inline: false },
      { name: 'PVE', value: `**IP:** ${PVE_HOST}\n**Porta:** ${PVE_PORT}`, inline: false }
    )
    .setTimestamp(new Date());

  await interaction.reply({ embeds: [embed] });
}
