import { Configs } from '@mtti/configs';
import { handleProcessEvents } from './handleProcessEvents';
import { logger } from './logger';

/**
 * Start the microservice.
 *
 * @param app Application's injectable main function
 * @param configs Optional configuration options container
 */
export async function bootstrap(configs: Configs): Promise<void> {
  handleProcessEvents();

  configs.on('loadFromFile', (file: string) => {
    logger.info(`Loaded configuration file: ${file}`);
  });

  await configs.loadFromProcess();
}
