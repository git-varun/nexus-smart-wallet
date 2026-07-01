import createApp from './app';
import {config} from './config/config';
import {createServiceLogger} from './utils';
import {closeDatabase, initializeDatabase} from './database';
import {startWorker, stopWorker} from './services/worker.service';
import {initializeRedis, closeRedis} from './services/redis.service';
import {notificationService} from './services/notification.service';

const logger = createServiceLogger('Nexus');

async function startServer() {
    try {
        const PORT = config.port || 3000;

        logger.info('Starting');

        // Initialize database
        await initializeDatabase();

        // Initialize Redis
        initializeRedis();

        // Initialize notification service
        notificationService.initialize();

        // Create and start app
        const app = await createApp();

        const server = app.listen(PORT, async () => {
            const apiLogger = createServiceLogger('API');
            apiLogger.info(`Listening on :${PORT}`);
            
            // Start queue worker
            await startWorker();

            logger.info('Ready');
        });

        // Graceful shutdown
        const shutdown = async () => {
            logger.info('Shutdown initiated');

            server.close(async () => {
                try {
                    await stopWorker();
                    await closeRedis();
                    await closeDatabase();
                    await notificationService.shutdown();
                    logger.info('Shutdown complete');
                    process.exit(0);
                } catch (error) {
                    logger.error('Shutdown error', error instanceof Error ? error : new Error(String(error)));
                    process.exit(1);
                }
            });

            // Force exit after 5 seconds
            setTimeout(() => {
                logger.error('Forced shutdown');
                process.exit(1);
            }, 5000);
        };

        // Shutdown handlers
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

        // Error handlers
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)));
            process.exit(1);
        });

    } catch (error) {
        logger.error('Failed to start server', error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
    }
}

// Start server if this is the main module
if (require.main === module) {
    startServer();
}

export {startServer};
