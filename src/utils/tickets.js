import {
  ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  AttachmentBuilder, EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder
} from 'discord.js';

/** Gera nome de canal por tipo */
function ticketChannelName(tipo, user) {
  const base = tipo.toLowerCase();
  const slug = user.username.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16);
  return `${base}-${slug}`;
}

export async function sendTicketLauncherMessage(channel) {
  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle('🗂️ Abertura de Tickets • Apertura de Tickets')
    .setDescription('Selecione uma opção (PT) • Selecciona una opción (ES)');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tkt_doacoes').setLabel('Doações/Donaciones').setStyle(ButtonStyle.Success).setEmoji('💰'),
    new ButtonBuilder().setCustomId('tkt_denuncia').setLabel('Denúncia/Denuncia').setStyle(ButtonStyle.Danger).setEmoji('🚨'),
    new ButtonBuilder().setCustomId('tkt_suporte').setLabel('Suporte/Soporte').setStyle(ButtonStyle.Primary).setEmoji('🛠️'),
  );
  const msg = await channel.send({ embeds: [embed], components: [row] });
  await msg.pin();
  return msg;
}

async function findExistingTicket(guild, user, tipo, parentId) {
  const namePrefix = `${tipo.toLowerCase()}-`;
  const channels = guild.channels.cache.filter(c =>
    c.type === ChannelType.GuildText &&
    c.parentId === (parentId || c.parentId) &&
    c.name.startsWith(namePrefix)
  );
  for (const ch of channels.values()) {
    const perms = ch.permissionsFor(user.id);
    if (perms && perms.has(PermissionFlagsBits.ViewChannel)) {
      return ch;
    }
  }
  return null;
}

export async function createTicket(interaction, cfg, tipo) {
  const guild = interaction.guild;
  const categoriaId = cfg.categoriaTickets;
  const staffRoles = (cfg.staffRoles ?? []).filter(Boolean);
  const member = await guild.members.fetch(interaction.user.id);

  // Limite: 1 ticket por tipo por usuário
  const existing = await findExistingTicket(guild, interaction.user, tipo, categoriaId);
  if (existing) {
    return interaction.reply({ content: `⚠️ Você já possui um ticket **${tipo}** aberto: ${existing}.`, ephemeral: true });
  }

  const overwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
  ];
  for (const rid of staffRoles) {
    overwrites.push({ id: rid, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.AttachFiles] });
  }

  const name = ticketChannelName(tipo, interaction.user);
  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: categoriaId || undefined,
    permissionOverwrites: overwrites
  });

  // Aviso no log de abertura
  try {
    const logOpen = cfg.logTicketsChannelId || cfg.canalVerificacao;
    const ref = `<#${channel.id}>`;
    await interaction.client.channels.fetch(logOpen)
      .then(ch => ch.send(`📝 Ticket **${tipo}** aberto em ${ref} por <@${interaction.user.id}>`))
      .catch(()=>{});
  } catch {}

  // Mensagem inicial + botão "Finalizar"
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tkt_finalizar').setLabel('Finalizar ticket').setStyle(ButtonStyle.Secondary).setEmoji('🧾'),
  );

  await channel.send({
    content: `Olá <@${interaction.user.id}>! Descreva seu caso. Staff foi notificada.`,
    components: [row]
  });

  // Fluxo guiado especial para Denúncia
  if (tipo === 'denuncia') {
    const modal = new ModalBuilder()
      .setCustomId(`tkt_denuncia_modal_${channel.id}`)
      .setTitle('Denúncia - Detalhes');
    const quem = new TextInputBuilder().setCustomId('quem').setLabel('Quem? (nick, ID, etc.)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100);
    const quando = new TextInputBuilder().setCustomId('quando').setLabel('Quando? (data/hora aproximada)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100);
    const onde = new TextInputBuilder().setCustomId('onde').setLabel('Onde? (mapa/local)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100);
    const oque = new TextInputBuilder().setCustomId('oque').setLabel('O que ocorreu? (resumo)').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(400);
    const provas = new TextInputBuilder().setCustomId('provas').setLabel('Provas (links) – anexe imagens no canal também').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(400);
    modal.addComponents(
      new ActionRowBuilder().addComponents(quem),
      new ActionRowBuilder().addComponents(quando),
      new ActionRowBuilder().addComponents(onde),
      new ActionRowBuilder().addComponents(oque),
      new ActionRowBuilder().addComponents(provas)
    );
    // Mostrar modal para o usuário que clicou
    await interaction.showModal(modal);
  } else {
    await interaction.reply({ content: `✅ Ticket criado: ${channel}`, ephemeral: true });
  }
}

export async function handleTicketModal(interaction) {
  const { customId } = interaction;
  if (!customId.startsWith('tkt_denuncia_modal_')) return false;
  const channelId = customId.split('_').pop();
  const ch = await interaction.client.channels.fetch(channelId).catch(()=>null);
  if (!ch) {
    await interaction.reply({ content: '⚠️ Canal do ticket não encontrado.', ephemeral: true });
    return true;
  }
  const quem = interaction.fields.getTextInputValue('quem');
  const quando = interaction.fields.getTextInputValue('quando');
  const onde = interaction.fields.getTextInputValue('onde');
  const oque = interaction.fields.getTextInputValue('oque');
  const provas = interaction.fields.getTextInputValue('provas') || '-';
  const embed = new EmbedBuilder()
    .setColor(0xFF5555)
    .setTitle('📣 Denúncia - Detalhes iniciais')
    .addFields(
      { name: 'Quem', value: quem, inline: true },
      { name: 'Quando', value: quando, inline: true },
      { name: 'Onde', value: onde, inline: true },
      { name: 'O que ocorreu', value: oque, inline: false },
      { name: 'Provas (links)', value: provas, inline: false },
    );
  await ch.send({ content: `<@${interaction.user.id}> enviou os detalhes iniciais. Adicione **imagens/vídeos** como anexos aqui.`, embeds: [embed] });
  await interaction.reply({ content: `✅ Detalhes enviados em ${ch}.`, ephemeral: true });
  return true;
}

async function fetchAllMessages(channel, max=1000) {
  const all = [];
  let lastId = undefined;
  while (all.length < max) {
    const batch = await channel.messages.fetch({ limit: 100, before: lastId }).catch(()=>null);
    if (!batch || batch.size === 0) break;
    const arr = [...batch.values()];
    all.push(...arr);
    lastId = arr[arr.length-1].id;
    if (batch.size < 100) break;
  }
  // invert order old->new
  return all.reverse().slice(-max);
}

export async function finalizeTicket(interaction, cfg) {
  const ch = interaction.channel;
  // Coleta histórico com paginação
  const msgs = await fetchAllMessages(ch, 1000);
  const lines = msgs.map(m => {
    const at = new Date(m.createdTimestamp).toISOString().replace('T',' ').split('.')[0];
    const author = `${m.author.tag}`;
    const attachments = m.attachments?.size ? ` [anexos: ${[...m.attachments.values()].map(a=>a.url).join(', ')}]` : '';
    const content = (m.content || '').replace(/\n/g,'\n');
    return `[${at}] ${author}: ${content}${attachments}`.trim();
  });
  const text = lines.join('\n');
  const file = new AttachmentBuilder(Buffer.from(text, 'utf-8'), { name: `transcript-${ch.name}.txt` });

  // DM para quem finalizou (autor do clique)
  try {
    await interaction.user.send({ content: '🧾 Transcript do seu ticket.', files: [file] });
  } catch {}

  // Envia no canal de transcripts
  const transcriptsId = '1401951731541213234';
  try {
    const logCh = await interaction.client.channels.fetch(transcriptsId);
    await logCh.send({ content: `🧾 Transcript de ${ch} encerrado por <@${interaction.user.id}>`, files: [file] });
  } catch {}

  await interaction.reply({ content: '✅ Transcript gerado e enviado. O canal será apagado em 10s.', ephemeral: true });
  setTimeout(() => {
    ch.delete('Ticket finalizado');
  }, 10000);
}
