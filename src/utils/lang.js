import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export async function buildLanguageMessage() {
  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle('🌍 Escolha seu idioma / Elige tu idioma')
    .setDescription('Selecione abaixo para continuar / Selecciona abajo para continuar:');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('lang_pt').setLabel('BR Português').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('lang_es').setLabel('ES Español').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export function serverChoiceRow(lang='pt') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('choose_rp').setLabel(lang==='es'?'Servidor RolePlay':'Servidor RolePlay').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('choose_pve').setLabel(lang==='es'?'Servidor PvE':'Servidor PvE').setStyle(ButtonStyle.Primary),
  );
}
