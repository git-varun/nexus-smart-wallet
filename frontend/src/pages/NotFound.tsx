import React from 'react';
import { Page } from '@/app/layouts/Layout';
import { StateView } from '@/shared/ui/StateView';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Page title="Page Not Found">
            <StateView 
                type="no-results"
                title="Page Not Found"
                description="The page you are looking for does not exist or has been moved."
                actionText="Return Home"
                onAction={() => navigate('/')}
            />
        </Page>
    );
};

export default NotFound;
