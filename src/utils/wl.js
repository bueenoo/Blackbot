import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits
} from 'discord.js';
import fs from 'fs';
import path from 'path';
const cfg = JSON.parse(fs.readFileSync(path.resolve('./src/config.json'), 'utf8'));

const sessions = new Map();

const QUESTIONS_PT = [
  { key: 'nome', prompt: 'Seu nome completo?' },
  { key: 'idade', prompt: 'Sua idade?' },
  { key: 'steam', prompt: 'Sua SteamID64 (ex.: 7656119XXXXXXXXXX)?' },
  { key: 'experiencia', prompt: 'Experiência com RP? (Sim/Não)' },
  { key: 'historia', prompt: 'Escreva a história do seu personagem (até 1000 caracteres).' },
];

const QUESTIONS_ES = [
  { key: 'nome', prompt: '¿Tu nombre completo?' },
  { key: 'idade', prompt: '¿Tu edad?' },
  { key: 'steam', prompt: 'Tu SteamID64 (ej.: 7656119XXXXXXXXXX)?' },
  { key: 'experiencia', prompt: '¿Experiencia con RP? (Sí/No)' },
  { key: 'historia', prompt: 'Escribe la historia de tu personaje (hasta 1000 caracteres).' },
];

function getQuestions(lang='pt') { return lang==='es' ? QUESTIONS_ES : QUESTIONS_PT; }

export async function startWL(interaction, lang='pt') {
  const user = interaction.user;
  sessions.set(user.id, { lang, step: 0, data: {} });
  await interaction.reply({ content: lang==='es' ? '📝 Empecemos la WL por DM. Revisa tus mensajes directos.' : '📝 Vamos começar a WL por DM. Veja sua DM.', ephemeral: true });
  try {
    const dm = await user.createDM();
    await dm.send(lang==='es' ? '¡Hola! Responde a las preguntas una por una. Para cancelar, envía `cancelar`.' : 'Olá! Responda às perguntas uma por vez. Para cancelar, envie `cancelar`.');
    await askNext(user.id, dm);
  } catch {
    await interaction.followUp({ content: lang==='es' ? '❌ No pude enviarte DM. Verifica tu configuración de privacidad.' : '❌ Não consegui enviar DM. Verifique suas configurações de privacidade.', ephemeral: true });
  }
}

async function askNext(userId, dm) {
  const sess = sessions.get(userId);
  if (!sess) return;
  const qs = getQuestions(sess.lang);
  if (sess.step >= qs.length) { await finishAndSendToStaff(userId, dm); return; }
  const q = qs[sess.step];
  await dm.send(`**${q.prompt}**`);
}

export async function handleDMMessage(msg) {
  if (!msg.guild && !msg.author.bot) {
    const sess = sessions.get(msg.author.id);
    if (!sess) return;
    const content = msg.content?.trim() || '';
    if (/^cancelar$/i.test(content)) { sessions.delete(msg.author.id); await msg.channel.send('❌ WL cancelada.'); return; }
    const qs = getQuestions(sess.lang);
    const q = qs[sess.step];
    const limit = q.key === 'historia' ? 1000 : 1000;
    sess.data[q.key] = content.slice(0, limit);
    sess.step += 1;
    sessions.set(msg.author.id, sess);
    await askNext(msg.author.id, msg.channel);
  }
}

function permMissing(perms, needed) {
  const missing = needed.filter(p => !perms.has(p));
  return missing.map(p => PermissionFlagsBits[p] ? p : String(p));
}

async function finishAndSendToStaff(userId, dm) {
  const sess = sessions.get(userId);
  if (!sess) return;
  sessions.delete(userId);
  const data = sess.data;

  const embed = new EmbedBuilder().setColor(0x2B2D31).setTitle(sess.lang==='es' ? 'Nueva WL • ES' : 'Nova WL • PT')
    .addFields(
      { name: 'Usuário', value: `<@${userId}> (${userId})`, inline: false },
      { name: 'Nome', value: data.nome || '-', inline: true },
      { name: 'Idade', value: data.idade || '-', inline: true },
      { name: 'Discord ID', value: `${userId}`, inline: true },
      { name: 'Steam ID', value: data.steam || '-', inline: false },
      { name: 'Experiência RP', value: data.experiencia || '-', inline: false },
      { name: 'História', value: (data.historia || '-').slice(0, 1000), inline: false },
      { name: 'Lang', value: sess.lang.toUpperCase(), inline: true }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`wl_aprovar_${userId}`).setLabel('Aprovar').setStyle(3),
    new ButtonBuilder().setCustomId(`wl_reprovar_${userId}`).setLabel('Reprovar').setStyle(4),
  );

  // Resolve canal staff e verifica permissões
  const staffId = cfg.canalWLStaff || '1401951752055427152';
  try {
    const ch = await dm.client.channels.fetch(staffId);
    const perms = ch.permissionsFor(dm.client.user.id);
    const needed = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];
    const missing = permMissing(perms, needed);
    if (missing.length) {
      await dm.send(`⚠️ Não tenho permissões suficientes em <#${staffId}>: ${missing.join(', ')}. Avise a administração.`);
      return;
    }
    await ch.send({ embeds: [embed], components: [row] });
    await dm.send('✅ WL enviada para análise da staff. Aguarde o retorno.');
  } catch (e) {
    await dm.send(`⚠️ Não consegui enviar sua WL ao canal <#${staffId}>. Erro: ${e?.code || e?.message}`);
  }
}

export async function handleWLButtons(interaction) {
  const { customId } = interaction;
  if (customId.startsWith('wl_aprovar_')) { const userId = customId.split('_').pop(); return approveWL(interaction, userId), true; }
  if (customId.startsWith('wl_reprovar_')) {
    const userId = customId.split('_').pop();
    const modal = new ModalBuilder().setCustomId(`wl_reject_modal_${userId}`).setTitle('Motivo da reprovação');
    const input = new TextInputBuilder().setCustomId('motivo').setLabel('Explique o motivo').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }
  return false;
}

export async function handleWLModal(interaction) {
  const { customId } = interaction;
  if (!customId.startsWith('wl_reject_modal_')) return false;
  const userId = customId.split('_').pop();
  const motivo = interaction.fields.getTextInputValue('motivo');

  const rejectedChannelId = cfg.canalWLReprovada;
  try { const ch = await interaction.client.channels.fetch(rejectedChannelId); await ch.send(`❌ WL reprovada para <@${userId}>.\n**Motivo:** ${motivo}`); } catch {}
  try { const user = await interaction.client.users.fetch(userId); await user.send(`❌ Sua WL foi reprovada.\n**Motivo:** ${motivo}\nVocê pode refazer quando quiser.`); } catch {}
  await interaction.reply({ content: 'Reprovação registrada e informada.', ephemeral: true });
  return true;
}

async function approveWL(interaction, userId) {
  try {
    const guild = interaction.guild;
    const member = await guild.members.fetch(userId);
    const roleId = cfg.cargoRP;
    await member.roles.add(roleId, 'WL aprovada');
    try { const user = await interaction.client.users.fetch(userId); await user.send('✅ Parabéns! Sua WL foi aprovada. O cargo RP foi aplicado.'); } catch {}
    await interaction.reply({ content: `✅ WL aprovada e cargo aplicado para <@${userId}>.`, ephemeral: true });
  } catch (e) {
    await interaction.reply({ content: '⚠️ Não consegui aplicar o cargo. Verifique permissões/IDs.', ephemeral: true });
  }
}
