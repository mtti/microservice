import path from 'path';
import { Configs } from '@mtti/configs';
import { handleProcessEvents } from './handleProcessEvents';

/**
 * Start the microservice.
 *
 * @param app Application's injectable main function
 * @param configs Optional configuration options container
 */
export async function bootstrap(configs: Configs): Promise<void> {
  handleProcessEvents();

  configs.setEnv(process.env);

  const env = process.env.NODE_ENV || 'development';
  const configPath = configs.has('configPath') ? configs.get('configPath') as string : path.join(process.cwd(), 'config');
  await configs.tryFile(path.join(configPath, 'common.yml'));
  await configs.tryFile(path.join(configPath, `${env}.yml`));
}
