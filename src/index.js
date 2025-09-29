    ];
    
    try {
        console.log('🔄 Registrando comandos slash...');
        
        // Registra comandos globalmente
        await client.application.commands.set(commands);
        
        console.log('✅ Comandos slash registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos slash:', error);
    }
}
// Event listener para quando o bot está pronto para registrar comandos
client.once('ready', async () => {
    await registerSlashCommands();
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Desligando bot...');
    client.destroy();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n🔄 Desligando bot...');
    client.destroy();
    process.exit(0);
});
// Faz login do bot
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Erro ao fazer login:', error);
    console.error('Verifique se o token no arquivo .env está correto');
    process.exit(1);
});
// Log de inicialização
console.log('🚀 Iniciando Blackbot...');
console.log('📝 Verifique se o arquivo .env existe com DISCORD_TOKEN');
