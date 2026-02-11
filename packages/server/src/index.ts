import { loadConfig } from './config.js';
import { createApp } from './app.js';
import { logger } from './logger.js';

async function main() {
  const config = loadConfig();
  const app = await createApp(config);

  app.listen(config.PORT, () => {
    logger.info(`Server listening on port ${config.PORT}`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
