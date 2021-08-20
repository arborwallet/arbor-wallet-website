import dotenv from 'dotenv';
import express from 'express';
import expressWinston from 'express-winston';
import { TransformableInfo } from 'logform';
import winston from 'winston';
import 'winston-daily-rotate-file';

// Reads the environment variables from the .env file.
dotenv.config();

// Sets up the Winston logging instance.
const logFormat = ({ timestamp, level, message, meta }: TransformableInfo) => {
    return `[${timestamp}] - ${level}: ${message}${
        meta ? ' ' + JSON.stringify(meta) : ''
    }`;
};
const logger = winston.createLogger({
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

// Sets up the Express application instance with middleware.
const app = express();
app.use(
    expressWinston.logger({
        winstonInstance: logger,
        msg: 'HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',
        meta: true,
    })
);

app.get('/', (req, res) => {
    res.status(200).send('Nothing to see here.');
});

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
