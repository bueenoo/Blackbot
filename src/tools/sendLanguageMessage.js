import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import cfg from '../config.json' assert { type: 'json' };
import { buildLanguageMessage } from '../utils/lang.js';
import { ensureEnv } from '../utils/validate.js';

ensureEnv(['TOKEN', 'VERIFY_CHANNEL_ID']);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

client.once('ready', async () => {
  try {
    const channelId = process.env.VERIFY_CHANNEL_ID || cfg.canalVerificacao;
    const ch = await client.channels.fetch(channelId);
    if (!ch) throw new Error('Canal não encontrado');
    const payload = await buildLanguageMessage();
    const msg = await ch.send(payload);
    await msg.pin();
    console.log('📌 Mensagem de idioma enviada e fixada.');
  } catch (e) {
    console.error('❌ Erro ao enviar mensagem de idioma:', e);
  } finally {
    client.destroy();
  }
});

client.login(process.env.TOKEN);
