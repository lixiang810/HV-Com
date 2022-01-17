/* eslint-disable @typescript-eslint/no-shadow */
import colors from 'colors';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import format from 'date-fns/format';
import route from './route';
import argv from './argv';

const { combine, timestamp, label, printf, splat } = winston.format;

type ILevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

const formatDate = (dateStr: string) => format(new Date(dateStr), 'MM-dd HH:mm:ss');

const myConsoleFormat = printf(({ level, message, label, timestamp, statusCode }) => {
  const levelStr = (() => {
    switch (level as ILevel) {
      case 'error':
        return 'bgRed';
      case 'debug':
        return 'bgGray';
      case 'http':
        return 'bgBlue';
      case 'info':
        return 'bgGreen';
      case 'silly':
        return 'bgGray';
      case 'verbose':
        return 'bgGray';
      case 'warn':
        return 'bgYellow';
      default:
        return 'bgGray';
    }
  })();
  const statusColor = (statusCode?.toString() as string | undefined)?.startsWith('2')
    ? 'bgGreen'
    : 'bgRed';
  // colors.js is not fully typed, so sad.
  /* @ts-ignore */
  return `${label}${colors.underline(formatDate(timestamp))} ${colors[levelStr](
    `[${level.toUpperCase()}]`,
  )} ${statusCode ? `${colors[statusColor](`[${statusCode}]`)} ` : ''}${colors.dim(message)}`;
});

const myFileFormat = printf(
  ({ level, message, timestamp, statusCode }) =>
    `${formatDate(timestamp)} [${level}] ${statusCode ? `[${statusCode}] ` : ' '}${message}`,
);

const fileFormat = combine(splat(), timestamp(), myFileFormat);
const consoleFormat = combine(label({ label: '🏗️' }), timestamp(), myConsoleFormat);

/** `drf` means `daily rotate file` */
const drfAllTransport = new DailyRotateFile({
  format: fileFormat,
  dirname: route.logRoute,
  filename: 'log-%DATE%',
  extension: '.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '14d',
  level: 'silly',
});

const drfErrorTransport = new DailyRotateFile({
  format: fileFormat,
  dirname: route.logRoute,
  filename: 'error-%DATE%',
  extension: '.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '365d',
  level: 'error',
});

const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: !argv.dev ? 'verbose' : 'silly',
});

const logger = winston.createLogger({
  transports: [drfAllTransport, drfErrorTransport, consoleTransport],
});

export default logger;
