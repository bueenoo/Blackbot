import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data as infoCmd } from '../commands/info.js';
import { ensureEnv } from '../utils/validate.js';

ensureEnv(['TOKEN', 'CLIENT_ID', 'GUILD_ID']);

const commands = [infoCmd.toJSON()];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
  console.log('🔧 Registrando (guild) slash commands...');
  const route = Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID);
  await rest.put(route, { body: commands });
  console.log('✅ Comandos registrados com sucesso.');
} catch (e) {
  console.error('❌ Erro registrando comandos:', e);
  process.exit(1);
}
