import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data as infoCmd } from '../commands/info.js';
import { data as diagCmd } from '../commands/diag.js';
import { ensureEnv } from '../utils/validate.js';
ensureEnv(['TOKEN','CLIENT_ID','GUILD_ID']);
const rest = new REST({ version: '10' }).setToken((process.env.TOKEN||'').trim());
await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [infoCmd.toJSON(), diagCmd.toJSON()] });
console.log('✅ Comandos registrados (guild): /info, /diag');
