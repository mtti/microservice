import { Configs } from '@mtti/configs';
import { injectFunction } from '@mtti/deps';
import winston from 'winston';

export async function logger(configs: Configs): Promise<winston.Logger> {
  let level = 'debug';
  let silent = false;
  if (process.env.NODE_ENV === 'production') {
    level = 'info';
  } else if (process.env.NODE_ENV === 'test') {
    silent = true;
  }

  if (configs.has('logLevel')) {
    level = configs.get('logLevel') as string;
  }

  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf((i: any) => `${i.timestamp} ${i.level.toUpperCase()} ${i.message}`),
    ),
    transports: [
      new winston.transports.Console(),
    ],
    silent,
    exitOnError: false,
  });
}
injectFunction([Configs], logger);
