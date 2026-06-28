import React from 'react';
import { Page } from '@/app/layouts/Layout';
import { SecurityWidget } from '@/widgets/SecurityWidget/SecurityWidget';

export const Security: React.FC = () => {
    return (
        <Page 
            title="Security Center" 
            description="Manage cryptographic session delegation policies, track access monitoring logs, and assess smart wallet vulnerability metrics."
        >
            <SecurityWidget />
        </Page>
    );
};

export default Security;
