import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import { ensureEnv } from './utils/validate.js';
import fs from 'fs'; import path from 'path';
const cfg = JSON.parse(fs.readFileSync(path.resolve('./src/config.json'),'utf8'));
import { serverChoiceRow } from './utils/lang.js';
import { handlePVEMessage } from './utils/pve-handler.js';
import * as infoCmd from './commands/info.js';
import * as diagCmd from './commands/diag.js';
import { sendTicketLauncherMessage, createTicket, finalizeTicket, } from './utils/tickets.js';
import { startWL, handleDMMessage, handleWLButtons, handleWLModal } from './utils/wl.js';

ensureEnv(['TOKEN']);
const client = new Client({ intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.DirectMessages], partials:[Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User]});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  try { const openerId = cfg.canalTicketsOpener; const ch = await client.channels.fetch(openerId); if (ch) { await sendTicketLauncherMessage(ch); console.log('🎫 Mensagem de abertura de tickets ativa.'); } } catch(e){ console.warn('Ticket opener falhou:', e?.code||e?.message); }
});

const commands = new Map([[infoCmd.data.name, infoCmd],[diagCmd.data.name, diagCmd]]);

client.on(Events.InteractionCreate, async (interaction) => {
  try{
    if (interaction.isChatInputCommand()) {
      const h = commands.get(interaction.commandName);
      if (h?.execute) return h.execute(interaction);
    }
    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id==='lang_pt') return interaction.reply({ content:'✅ Você selecionou Português.\nEscolha o servidor:', components:[serverChoiceRow('pt')], ephemeral:true });
      if (id==='lang_es') return interaction.reply({ content:'✅ Has seleccionado Español.\nElige tu servidor:', components:[serverChoiceRow('es')], ephemeral:true });
      if (id==='choose_rp') return startWL(interaction, 'pt');
      if (id==='choose_pve') return interaction.reply({ content:`🧾 Para PVE: vá até <#${cfg.canalPVEEntrada}> e envie sua SteamID64.`, ephemeral:true });
      if (id==='tkt_doacoes') return createTicket(interaction, cfg, 'doacoes');
      if (id==='tkt_denuncia') return createTicket(interaction, cfg, 'denuncia');
      if (id==='tkt_suporte') return createTicket(interaction, cfg, 'suporte');
      if (id==='tkt_finalizar') return finalizeTicket(interaction, cfg);
      const handled = await handleWLButtons(interaction); if (handled) return;
    }
    if (interaction.isModalSubmit()) {
      const handledWL = await handleWLModal(interaction); if (handledWL) return;
    }
  }catch(e){ console.error('[INTERACTION ERROR]', e); if (interaction.isRepliable?.()) try{ await interaction.reply({ content:'⚠️ Ocorreu um erro. Tente novamente.', ephemeral:true }); }catch{} }
});

client.on(Events.MessageCreate, async (msg) => { try{ await handlePVEMessage(client, msg, cfg); if (!msg.guild) await handleDMMessage(msg, client); } catch(e){ console.error('Message handler error:', e);} });

for (const sig of ['SIGINT','SIGTERM']) process.on(sig, ()=>{ try{ client.destroy(); }catch{} process.exit(0); });

client.login((process.env.TOKEN||'').trim());
