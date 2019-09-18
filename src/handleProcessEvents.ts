import { logger } from './logger';

export function handleProcessEvents(): void {
  process.on('unhandledRejection', (reason) => {
    if (reason) {
      if (reason instanceof Error && reason.stack) {
        logger.error(reason.stack);
      } else {
        try {
          logger.error(JSON.stringify(reason));
        } catch (err) {
          logger.error(reason);
        }
      }
    } else {
      logger.error('Unhandled rejection with no reason');
    }
    process.exit(1);
  });
}
