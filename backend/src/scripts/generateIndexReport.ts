/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
    UserModel,
    AccountModel,
    TransactionModel,
    NonceModel,
    SessionKeyModel,
    PortfolioModel,
    TokenMetadataModel,
    UserSessionModel,
    RevokedTokenModel,
    NotificationEventModel
} from '../models';

dotenv.config();

async function run() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus-wallet';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Building Mongoose indexes...');
    await Promise.all(mongoose.modelNames().map(modelName => mongoose.model(modelName).init()));
    console.log('Mongoose indexes compiled.');

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection failed');
    }
    const collections = await db.listCollections().toArray();

    let md = '# MongoDB Index Audit & Verification Report\n\n';
    md += `Generated at: ${new Date().toISOString()}\n\n`;
    md += 'This report contains an audit of all active collections and their configured indexes to verify correct query planning, compound index utilization, and elimination of collection scans.\n\n';

    for (const colInfo of collections) {
        const colName = colInfo.name;
        if (colName.startsWith('system.')) continue;

        md += `## Collection: \`${colName}\`\n\n`;
        md += '| Index Name | Keys | Unique | Sparse | Background |\n';
        md += '|---|---|---|---|---|\n';

        const indexes = await db.collection(colName).indexes();
        for (const idx of indexes) {
            const keysStr = Object.entries(idx.key).map(([k, v]) => `\`${k}: ${v}\``).join(', ');
            md += `| ${idx.name} | ${keysStr} | ${idx.unique ? '✅ True' : '❌ False'} | ${idx.sparse ? '✅ True' : '❌ False'} | ${idx.background ? '✅ True' : '❌ False'} |\n`;
        }
        md += '\n';

        // Explain query planning example
        md += '### Query Plan Explanation\n\n';
        try {
            let query = {};
            if (colName === 'users') {
                query = { email: 'test@example.com' };
            } else if (colName === 'accounts') {
                query = { address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', chainId: 84532 };
            } else if (colName === 'portfolios') {
                query = { address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', chainId: 84532 };
            } else if (colName === 'nonces') {
                query = { signerAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', chainId: 84532 };
            } else if (colName === 'transactions') {
                query = { userId: 'user-123', chainId: 84532 };
            } else if (colName === 'sessionkeys') {
                query = { publicKey: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' };
            } else if (colName === 'usersessions') {
                query = { refreshToken: 'token-123' };
            } else if (colName === 'revokedtokens') {
                query = { token: 'token-123' };
            } else if (colName === 'notificationevents') {
                query = { userId: 'user-123', timestamp: new Date() };
            } else if (colName === 'tokenmetadatas') {
                query = { chainId: 84532, address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' };
            }

            const explain = await db.collection(colName).find(query).explain('queryPlanner');
            const winningStage = explain.queryPlanner?.winningPlan?.stage || 'UNKNOWN';
            const inputStage = explain.queryPlanner?.winningPlan?.inputStage?.stage || '';
            md += `- **Winning Plan Stage:** \`${winningStage}\` ${inputStage ? `-> \`${inputStage}\`` : ''}\n`;
            if (winningStage.includes('COLLSCAN')) {
                md += '- **Warning:** ⚠️ Collection scan detected for this query pattern!\n';
            } else {
                md += '- **Index Usage:** ✅ Index scan utilized successfully.\n';
            }
        } catch (err: any) {
            md += `- **Error getting explain plan:** ${err.message}\n`;
        }
        md += '\n---\n\n';
    }

    const docsDir = path.join(__dirname, '../../../docs');
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    const reportPath = path.join(docsDir, 'INDEX_REPORT.md');
    fs.writeFileSync(reportPath, md);
    console.log(`Report successfully written to ${reportPath}`);

    await mongoose.disconnect();
}

run().catch(console.error);
