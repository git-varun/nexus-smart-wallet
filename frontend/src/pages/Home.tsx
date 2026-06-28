import React from 'react';
import { Page } from '@/app/layouts/Layout';
import { PortfolioSummary } from '@/widgets/PortfolioSummary/PortfolioSummary';
import { QuickActions } from '@/widgets/QuickActions/QuickActions';
import { SecurityOverview } from '@/widgets/SecurityOverview/SecurityOverview';
import { NotificationsPreview } from '@/widgets/NotificationsPreview/NotificationsPreview';
import { TransactionHistory } from '@/widgets/RecentActivity/RecentActivity';

const Home: React.FC = () => {
    return (
        <Page 
            title="Overview"
            description="Manage your smart assets, key authorizations, and network transactions from a unified layout."
            breadcrumbs={['Home', 'Overview']}
        >
            <div className="space-y-8">
                {/* Canonical Portfolio Summary Widget */}
                <PortfolioSummary />

                {/* Main Operations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Left & Middle Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <QuickActions />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <SecurityOverview />
                        <NotificationsPreview />
                        <div className="bg-slate-900/10 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-slate-200 mb-4">Recent Activity</h3>
                            <TransactionHistory limit={4} showHeader={false} />
                        </div>
                    </div>
                </div>
            </div>
        </Page>
    );
};

export default Home;
