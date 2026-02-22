const ngrok = require('ngrok');

const DEFAULT_PORT = process.env.WEB_PORT || process.env.PORT || '19006';

(async () => {
  const port = parseInt(String(DEFAULT_PORT), 10);
  if (Number.isNaN(port)) {
    console.error('Porta inválida para o túnel. Defina WEB_PORT ou PORT como um número.');
    process.exit(1);
  }

  if (!process.env.NGROK_AUTHTOKEN) {
    console.log(
      'Aviso: NGROK_AUTHTOKEN não encontrado.\n' +
        '- Para usar ngrok, crie uma conta e defina a variável de ambiente NGROK_AUTHTOKEN.\n' +
        '- Alternativa recomendada para Expo no celular: use "npm run tunnel:expo" (Cloudflare).'
    );
  }

  const url = await ngrok.connect({
    addr: port,
    authtoken: process.env.NGROK_AUTHTOKEN,
    proto: 'http'
  });

  console.log(`Túnel web ativo: ${url} -> http://localhost:${port}`);
  console.log('Abra este link no seu celular para testar a versão web.');
  console.log('Pressione Ctrl+C para encerrar o túnel.');
})().catch((err) => {
  console.error('Falha ao iniciar ngrok:', err?.message || err);
  process.exit(1);
});

