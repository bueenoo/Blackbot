import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { buildLanguageMessage } from '../utils/lang.js';
import { ensureEnv } from '../utils/validate.js';
ensureEnv(['TOKEN','VERIFY_CHANNEL_ID']);
const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });
client.once('ready', async () => {
  try {
    const ch = await client.channels.fetch(process.env.VERIFY_CHANNEL_ID);
    const payload = await buildLanguageMessage();
    const msg = await ch.send(payload);
    await msg.pin();
    console.log('📌 Mensagem de idioma enviada e fixada.');
  } catch (e) { console.error('❌ Erro ao enviar mensagem de idioma:', e?.code || e?.message); } finally { client.destroy(); }
});
client.login((process.env.TOKEN||'').trim());
