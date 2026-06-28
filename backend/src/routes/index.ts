import {Router} from 'express';
import * as authController from '../controllers/auth.controller';
import * as accountController from '../controllers/account.controller';
import * as transactionController from '../controllers/transaction.controller';
import * as healthController from '../controllers/health.controller';
import {
    requireAuth,
    authRateLimiter,
    walletRateLimiter,
    deployRateLimiter,
    sendTxRateLimiter,
    pollingRateLimiter,
    healthRateLimiter,
    validateBody,
    registerSchema,
    loginSchema,
    refreshSchema,
    revokeSessionSchema,
    createAccountSchema,
    deployAccountSchema,
    sendTransactionSchema,
    sendTransactionBatchSchema,
    estimateGasSchema,
    userOpStatusSchema,
    createSessionKeySchema,
    revokeSessionKeySchema,
    validateSessionKeySchema,
    validateCompatibilitySchema,
    portfolioRefreshSchema
} from '../middleware';
import * as userController from "../controllers/user.controller";
import * as sessionKeyController from '../controllers/sessionKey.controller';
import * as configController from '../controllers/config.controller';
import * as portfolioController from '../controllers/portfolio.controller';
import * as notificationController from '../controllers/notification.controller';
import {upload} from "../middleware/upload.middleware";

const router: Router = Router();

// Health & Operational Metrics Routes (Public with Rate Limiting)
router.get('/health', healthRateLimiter, healthController.health);
router.get('/health/liveness', healthRateLimiter, healthController.liveness);
router.get('/health/startup', healthRateLimiter, healthController.startup);
router.get('/health/readiness', healthRateLimiter, healthController.readiness);
router.get('/metrics', healthRateLimiter, healthController.getMetrics);

// Capability Discovery Routes (Public with Rate Limiting)
router.get('/capabilities', healthRateLimiter, configController.getCapabilities);
router.post('/capabilities/validate', healthRateLimiter, validateBody(validateCompatibilitySchema), configController.validateCompatibility);

// Auth Routes (Public with Auth Rate Limiting and Validation)
router.post('/auth/register', authRateLimiter, validateBody(registerSchema), authController.register);
router.post('/auth/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh', authRateLimiter, validateBody(refreshSchema), authController.refresh);
router.get('/auth/status', authController.getStatus);
router.get('/auth/sessions', requireAuth, authController.getSessions);
router.post('/auth/sessions/revoke', requireAuth, validateBody(revokeSessionSchema), authController.revokeSessionEndpoint);

// Smart Account Routes (Protected with Wallet Creation Rate Limiting)
router.post('/accounts/create', requireAuth, walletRateLimiter, validateBody(createAccountSchema), accountController.createSmartAccount);
router.get('/accounts/me', requireAuth, accountController.getMySmartAccounts);
router.get('/accounts/:address', requireAuth, accountController.getSmartAccountDetails);

router.get('/portfolio', requireAuth, portfolioController.fetchPortfolio);
router.post('/portfolio/refresh', requireAuth, walletRateLimiter, validateBody(portfolioRefreshSchema), portfolioController.refreshPortfolio);

// Notification Routes
router.get('/notifications/subscribe', notificationController.subscribeNotifications);

// Session Key Routes (Protected with Rate Limiting)
router.post('/sessions/create', requireAuth, walletRateLimiter, validateBody(createSessionKeySchema), sessionKeyController.createSessionKey);
router.get('/sessions', requireAuth, sessionKeyController.getSessionKeys);
router.post('/sessions/revoke', requireAuth, walletRateLimiter, validateBody(revokeSessionKeySchema), sessionKeyController.revokeSessionKey);
router.post('/sessions/validate', requireAuth, validateBody(validateSessionKeySchema), sessionKeyController.validateSessionKey);



// Transaction Routes (Protected with specialized Rate Limiters & Schema Validations)
router.post('/transactions/deploy', requireAuth, deployRateLimiter, validateBody(deployAccountSchema), transactionController.deploySmartWallet);
router.post('/transactions/send', requireAuth, sendTxRateLimiter, validateBody(sendTransactionSchema), transactionController.sendTransaction);
router.post('/transactions/batch', requireAuth, sendTxRateLimiter, validateBody(sendTransactionBatchSchema), transactionController.sendTransactionBatch);
router.get('/transactions/history', requireAuth, transactionController.getTransactionHistory);
router.post('/transactions/estimate_gas', requireAuth, sendTxRateLimiter, validateBody(estimateGasSchema), transactionController.getGasEstimation);
router.put('/transactions/user_op', requireAuth, pollingRateLimiter, validateBody(userOpStatusSchema), transactionController.getOperationStatus);
router.get('/transactions/gas_price', transactionController.getGasPrice);
router.get('/transactions/:idOrHash', requireAuth, pollingRateLimiter, transactionController.getTransactionDetails);

// Profile Routes (Protected)
router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.get('/username/check', requireAuth, userController.checkUsernameAvailability);
router.post('/avatar/upload', requireAuth, upload.single('profileImage'), userController.uploadProfileImage);
router.put('/avatar/config', requireAuth, userController.updateAvatarConfig);
router.delete('/avatar', requireAuth, userController.deleteProfileImage);

export {router as routes};