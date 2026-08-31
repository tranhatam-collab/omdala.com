import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3010);

createApp()
  .listen({ port, host: '0.0.0.0' })
  .then((address) => {
    process.stdout.write(`Om AI backend listening on ${address}\n`);
  });
