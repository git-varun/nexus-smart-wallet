import React from 'react';
import { TransactionInterface } from '@/features/transaction/TransactionInterface';
import { Page } from '@/app/layouts/Layout';

const Transfer: React.FC = () => {
    return (
        <Page 
            title="Transfer" 
            description="Send tokens or execute batched calls in a single transactions queue."
        >
            <TransactionInterface />
        </Page>
    );
};

export default Transfer;
