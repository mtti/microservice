import winston from 'winston';

let level = 'debug';
let silent = false;
if (process.env.NODE_ENV === 'production') {
  level = 'info';
} else if (process.env.NODE_ENV === 'test') {
  silent = true;
}

export const createLogger = (): winston.Logger => winston
  .createLogger({
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
