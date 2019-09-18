import path from 'path';
import { Configs } from '@mtti/configs';
import { handleProcessEvents } from './handleProcessEvents';

/**
 * Start the microservice.
 *
 * @param app Application's injectable main function
 * @param configs Optional configuration options container
 */
export async function bootstrap(configs?: Configs): Promise<void> {
  handleProcessEvents();

  const cfg = configs || new Configs();
  cfg.setEnv(process.env);

  const env = process.env.NODE_ENV || 'development';
  const configPath = cfg.has('configPath') ? cfg.get('configPath') as string : path.join(process.cwd(), 'config');
  await cfg.tryFile(path.join(configPath, 'common.yml'));
  await cfg.tryFile(path.join(configPath, `${env}.yml`));
}
