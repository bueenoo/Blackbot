# Yellowbot (Fixed, ESM)

Projeto mínimo funcional para o seu Discord bot (verificação BR/ES, botões RP/PVE, handler de SteamID para PVE e comando `/info`).

## Requisitos
- Node.js 18+
- Criar `.env` a partir de `.env.example`

## Setup
```bash
npm i
cp .env.example .env   # edite TOKEN, CLIENT_ID, GUILD_ID
npm run register       # registra /info
npm run send:verify    # envia a mensagem de idiomas no canal de verificação
npm start
```

## Estrutura
```
src/
  index.js
  config.json
  commands/
    info.js
  tools/
    register-commands.js
    sendLanguageMessage.js
  utils/
    lang.js
    pve-handler.js
    validate.js
```

## Notas
- **Nunca** versione o TOKEN real. Revogue tokens vazados.
- Restrinja o `/info` ao canal configurado em `allowedInfoChannel`.
- O PVE lê mensagens **apenas** no canal configurado em `canalPVEEntrada`.

## Novidades
- **Tickets** (Doações, Denúncia, Suporte) com botão **Finalizar ticket**:
  - Notificação em `logTicketsChannelId` ao abrir
  - Transcript em .txt enviado via DM ao player e publicado em `1401951731541213234` ao finalizar
- **Whitelist por DM (RP)**:
  - Perguntas sequenciais por DM (PT/ES herda do botão de idioma)
  - Embed no canal da staff `1401951752055427152` com **Aprovar/Reprovar**
  - Aprovar → dá cargo RP e avisa o player por DM
  - Reprovar → abre modal para **motivo** e publica no canal `1402206198668853299`

### Extras incluídos
- Limite de **1 ticket por tipo por usuário**
- Transcript com **paginação até 1000 mensagens** e **URLs de anexos**
- Fluxo de **Denúncia** com **modal guiado** (quem/quando/onde/o que/provas) e suporte a anexos
- WL com mensagens em **PT/ES** e **História até 1000 caracteres**
