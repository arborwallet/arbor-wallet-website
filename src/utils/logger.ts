import expressWinston from 'express-winston';
import { TransformableInfo } from 'logform';
import winston from 'winston';
import 'winston-daily-rotate-file';

// The formatting helper for the logger.
const logFormat = ({ timestamp, level, message, meta }: TransformableInfo) => {
    return `[${timestamp}] - ${level}: ${message}${
        meta ? ' ' + JSON.stringify(meta) : ''
    }`;
};

// Sets up the Winston logging instance.
export const logger = winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            handleExceptions: true,
            handleRejections: true,
            level: 'debug',
            filename: './logs/debug/debug-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(logFormat)
            ),
        }),
        new winston.transports.DailyRotateFile({
            handleExceptions: true,
            handleRejections: true,
            level: 'error',
            filename: './logs/error/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(logFormat)
            ),
        }),
    ],
});

// Only log to the console in a development environment.
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            handleExceptions: true,
            level: 'debug',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(logFormat)
            ),
        })
    );
}

// Middleware for the logging instance.
export const loggerMiddleware = expressWinston.logger({
    winstonInstance: logger,
    msg: 'HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',
    meta: false,
});
