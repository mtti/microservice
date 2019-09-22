import { logger } from './logger';

export function handleProcessEvents(): void {
  process.on('unhandledRejection', (reason) => {
    if (reason) {
      if (reason instanceof Error && reason.stack) {
        logger.error(`Unhandled rejection: ${reason.stack}`);
      } else {
        try {
          logger.error(`Unhandled rejection: ${JSON.stringify(reason)}`);
        } catch (err) {
          logger.error(`Unhandled rejection: ${reason}`);
        }
      }
    } else {
      logger.error('Unhandled rejection with no reason');
    }
    process.exit(1);
  });
}
