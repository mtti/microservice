import { Configs } from '@mtti/configs';
import { Logger } from 'winston';
import { handleProcessEvents } from './handleProcessEvents';

/**
 * Start the microservice.
 *
 * @param app Application's injectable main function
 * @param configs Optional configuration options container
 */
export const bootstrap = async (
  logger: Logger,
  configs?: Configs,
): Promise<void> => {
  handleProcessEvents(logger);

  if (configs) {
    configs.on('loadFromFile', (file: string) => {
      logger.info(`Loaded configuration file: ${file}`);
    });
    await configs.loadFromProcess();
  }
};
