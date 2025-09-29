import 'dotenv/config';
import {
  Client, GatewayIntentBits, Partials, Events
} from 'discord.js';
import { ensureEnv } from './utils/validate.js';
import fs from 'fs';
import path from 'path';

const cfg = JSON.parse(fs.readFileSync(path.resolve('./src/config.json'), 'utf8'));

import { serverChoiceRow } from './utils/lang.js';
import { handlePVEMessage } from './utils/pve-handler.js';
import * as infoCmd from './commands/info.js';
import { sendTicketLauncherMessage, createTicket, finalizeTicket, handleTicketModal } from './utils/tickets.js';
import { startWL, handleDMMessage, handleWLButtons, handleWLModal } from './utils/wl.js';

ensureEnv(['TOKEN']);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  try {
    const openerId = '1401951493539758152';
    const ch = await client.channels.fetch(openerId);
    if (ch) {
      await sendTicketLauncherMessage(ch);
      console.log('🎫 Mensagem de abertura de tickets ativa.');
    }
  } catch (e) {
    console.warn('Não consegui configurar mensagem de tickets (ok continuar):', e?.message);
  }
});

const commands = new Map([[infoCmd.data.name, infoCmd]]);

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const handler = commands.get(interaction.commandName);
      if (handler?.execute) return handler.execute(interaction);
    }
    if (interaction.isButton()) {
      const { customId } = interaction;
      if (customId === 'lang_pt') {
        return interaction.reply({
          content: '✅ **Português** selecionado.\nEscolha seu servidor:',
          components: [serverChoiceRow('pt')],
          ephemeral: true
        });
      }
      if (customId === 'lang_es') {
        return interaction.reply({
          content: '✅ Has seleccionado **Español**.\nElige tu servidor:',
          components: [serverChoiceRow('es')],
          ephemeral: true
        });
      }
      if (customId === 'choose_rp') return startWL(interaction, 'pt');
      if (customId === 'choose_pve') {
        return interaction.reply({
          content: `🧾 Para PVE: vá até <#${cfg.canalPVEEntrada}> e envie sua SteamID64.`,
          ephemeral: true
        });
      }
      if (customId === 'tkt_doacoes') return createTicket(interaction, cfg, 'doacoes');
      if (customId === 'tkt_denuncia') return createTicket(interaction, cfg, 'denuncia');
      if (customId === 'tkt_suporte') return createTicket(interaction, cfg, 'suporte');
      if (customId === 'tkt_finalizar') return finalizeTicket(interaction, cfg);
      const handled = await handleWLButtons(interaction);
      if (handled) return;
    }
    if (interaction.isModalSubmit()) {
      const handledWL = await handleWLModal(interaction);
      if (handledWL) return;
      const handledT = await handleTicketModal(interaction);
      if (handledT) return;
    }
  } catch (e) {
    console.error('Interaction error:', e);
    if (interaction.isRepliable?.()) {
      try { await interaction.reply({ content: '❌ Ocorreu um erro.', ephemeral: true }); } catch {}
    }
  }
});

client.on(Events.MessageCreate, async (msg) => {
  try {
    await handlePVEMessage(client, msg, cfg);
    if (!msg.guild) await handleDMMessage(msg, client);
  } catch (e) {
    console.error('Message handler error:', e);
  }
});

for (const sig of ['SIGINT','SIGTERM']) {
  process.on(sig, () => {
    try { client.destroy(); } catch {}
    process.exit(0);
  });
}

client.login(process.env.TOKEN);
