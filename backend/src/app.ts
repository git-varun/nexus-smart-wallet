import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {config, validateConfig} from './config/config';
import {errorHandlerMiddleware, requestIdMiddleware} from './middleware';
import {routes} from './routes';
import {createServiceLogger, metrics, logger as globalLogger} from './utils';

const logger = createServiceLogger('App');

async function createApp(): Promise<express.Application> {
    const app = express();

    // Enable trust proxy for correct client IP detection behind reverse proxies/load balancers
    app.set('trust proxy', true);

    // Validate configuration
    validateConfig();
    logger.info('✅ Configuration validated');

    // Basic security headers
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", "https://*.alchemy.com", "https://*.pimlico.io", "https://sepolia.base.org"]
            }
        }
    }));

    // CORS - Restricted to configured origins in production
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }));

    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    // Generate RequestId tracing and bind AsyncLocalStorage context globally
    app.use(requestIdMiddleware);

    // BigInt JSON stringification compatibility
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };

    // Structured JSON request logger & metrics middleware
    app.use((req, res, next) => {
        const start = Date.now();
        metrics.activeRequests += 1;

        res.on('finish', () => {
            metrics.activeRequests -= 1;
            const duration = Date.now() - start;
            metrics.trackApiRequest(res.statusCode, duration);
            globalLogger.apiRequest('API', req.method, req.path, res.statusCode, duration);
        });

        next();
    });

    // Redirect root health requests to official endpoint
    app.get('/health', (req, res) => {
        res.redirect('/api/health');
    });

    // API routes
    app.use('/api', routes);

    // Root endpoint - Simple API info
    app.get('/', (req, res) => {
        res.json({
            name: 'Nexus Smart Wallet API',
            version: '1.0.0',
            status: 'running',
            docs: {
                auth: 'POST /api/auth/login',
                accounts: 'POST /api/accounts/create | GET /api/accounts/me',
                transactions: 'POST /api/transactions/send | GET /api/transactions/history',
                health: 'GET /health'
            }
        });
    });

    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            error: 'Not Found',
            path: req.originalUrl
        });
    });

    // Error handler (must be last)
    app.use(errorHandlerMiddleware);

    logger.info('🚀 Nexus Smart Wallet API ready');
    return app;
}

export default createApp;
