// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createStandardQueryClient } from '@/shared/lib/reactQuery';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '@/app/store/store';
import { MainLayout } from '@/app/layouts/MainLayout';
import { ErrorBoundary } from '@/app/layouts/ErrorBoundary';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { ToastProvider } from '@/app/providers/Toast';
import { StateView } from '@/shared/ui/StateView';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = createStandardQueryClient();

// Lazy loaded page components for code splitting
const Home = React.lazy(() => import('@/pages/Home'));
const Assets = React.lazy(() => import('@/pages/Assets'));
const Transfer = React.lazy(() => import('@/pages/Transfer'));
const Activity = React.lazy(() => import('@/pages/Activity'));
const Security = React.lazy(() => import('@/pages/Security'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const DeveloperTools = React.lazy(() => import('@/pages/DeveloperTools'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

function App() {
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <PersistGate
                    loading={
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                            <StateView type="loading" title="Secure Storage" description="Decrypting persistent storage keys..." />
                        </div>
                    }
                    persistor={persistor}
                >
                    <QueryClientProvider client={queryClient}>
                        <ThemeProvider>
                            <ToastProvider>
                                <BrowserRouter>
                                    <Routes>
                                        {/* Authenticated route group guarded by MainLayout */}
                                        <Route path="/" element={<MainLayout />}>
                                            <Route index element={<Home />} />
                                            <Route path="assets" element={<Assets />} />
                                            <Route path="transfer" element={<Transfer />} />
                                            <Route path="activity" element={<Activity />} />
                                            <Route path="security" element={<Security />} />
                                            <Route path="settings" element={<Settings />} />
                                            <Route path="developer" element={<DeveloperTools />} />
                                            <Route path="*" element={<NotFound />} />
                                        </Route>
                                    </Routes>
                                </BrowserRouter>
                            </ToastProvider>
                        </ThemeProvider>
                    </QueryClientProvider>
                </PersistGate>
            </Provider>
        </ErrorBoundary>
    );
}

export default App;
