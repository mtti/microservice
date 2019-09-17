import { Configs } from '@mtti/configs';
import { createLogger } from './createLogger';
import { handleProcessEvents } from './handleProcessEvents';
import path from 'path';
import winston from 'winston';
import { DependencyKey, injectFunction, Injector } from '@mtti/deps';

async function main(
  logger: winston.Logger,
): Promise<(injector: Injector, app: DependencyKey<unknown>) => Promise<void>> {
  return async (
    injector: Injector,
    app: DependencyKey<unknown>,
  ): Promise<void> => {
    handleProcessEvents(logger);
    await injector.resolve(app);
  };
}
injectFunction([createLogger], main);

/**
 * Start the microservice.
 *
 * @param app Application's injectable main function
 * @param configs Optional configuration options container
 */
export async function start<T>(
  app: DependencyKey<T>,
  configs?: Configs,
): Promise<void> {
  const cfg = configs || new Configs();
  cfg.setEnv(process.env);

  const env = process.env.NODE_ENV || 'development';
  const configPath = cfg.has('configPath') ? cfg.get('configPath') as string : path.join(process.cwd(), 'config');
  await cfg.tryFile(path.join(configPath, 'common.yml'));
  await cfg.tryFile(path.join(configPath, `${env}.yml`));

  const injector = new Injector();
  injector.bind(Configs, cfg);

  const mainFunc = await injector.resolve(main);
  await mainFunc(injector, app);
}
