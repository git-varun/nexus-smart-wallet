import React from 'react';
import { TransactionHistory } from '@/widgets/RecentActivity/RecentActivity';
import { Page } from '@/app/layouts/Layout';

const Activity: React.FC = () => {
    return (
        <Page 
            title="Activity" 
            description="View your smart wallet's transaction history, user operation logs, and real-time confirmations."
        >
            <TransactionHistory />
        </Page>
    );
};

export default Activity;
