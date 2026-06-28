import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';

interface BaseState {
    hasError: boolean;
    error: Error | null;
}

// ---------------------------------------------------------------------
// 1. Application-Level Error Boundary (Full app fallback screen)
// ---------------------------------------------------------------------
export class ApplicationErrorBoundary extends Component<{ children: ReactNode }, BaseState> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): BaseState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('💥 Root Application Crash caught by boundary:', error, errorInfo);
    }

    handleRestart = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-foreground">
                    <Card className="p-8 max-w-lg w-full border-red-500/20 bg-red-950/5 shadow-cyber text-center space-y-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 animate-pulse">
                            <span className="text-2xl text-red-500">🚨</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-extrabold text-red-500 tracking-tight">System Safe Mode</h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                The Nexus Shell encountered a critical error. Your assets and session keys remain fully secured on-chain.
                            </p>
                        </div>

                        {this.state.error && (
                            <code className="text-left font-mono text-[10px] text-red-400 bg-red-500/10 px-3 py-2 rounded block max-h-32 overflow-auto whitespace-pre-wrap">
                                {this.state.error.message}
                            </code>
                        )}

                        <div className="flex justify-center gap-3">
                            <Button onClick={this.handleRestart} variant="primary" size="sm">
                                Reload Application
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }
        return this.props.children;
    }
}

// ---------------------------------------------------------------------
// 2. Page-Level Error Boundary (Retains the Sidebar & Shell navigation)
// ---------------------------------------------------------------------
export class PageErrorBoundary extends Component<{ children: ReactNode; title?: string }, BaseState> {
    constructor(props: { children: ReactNode; title?: string }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): BaseState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`💥 Page Crash [${this.props.title || 'Unknown Page'}] caught:`, error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
                    <Card className="p-8 border-red-500/20 bg-red-950/5 shadow-cyber text-center space-y-6">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                            <span className="text-xl text-red-500">⚠️</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-foreground">Failed to render page</h2>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                An error occurred while drawing the page workspace. You can retry this page or navigate to another section using the sidebar.
                            </p>
                        </div>

                        {this.state.error && (
                            <code className="text-left font-mono text-[10px] text-red-400 bg-red-500/10 px-3 py-2 rounded block max-h-24 overflow-auto whitespace-pre-wrap max-w-md mx-auto">
                                {this.state.error.message}
                            </code>
                        )}

                        <div className="flex justify-center gap-3">
                            <Button onClick={this.handleRetry} variant="outline" size="sm">
                                Try Again
                            </Button>
                            <Button onClick={() => window.location.href = '/'} variant="primary" size="sm">
                                Return Home
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }
        return this.props.children;
    }
}

// ---------------------------------------------------------------------
// 3. Widget-Level Error Boundary (Isolates component/widget card failures)
// ---------------------------------------------------------------------
export class WidgetErrorBoundary extends Component<{ children: ReactNode; title?: string }, BaseState> {
    constructor(props: { children: ReactNode; title?: string }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): BaseState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`💥 Widget Failure [${this.props.title || 'Component'}] caught:`, error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Card className="p-5 border-dashed border-red-500/30 bg-red-950/5 flex flex-col justify-between items-center text-center space-y-3 min-h-[140px]">
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                            Widget Failed to Load
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-normal max-w-xs">
                            {this.state.error?.message || 'Component runtime exception'}
                        </p>
                    </div>
                    <Button onClick={this.handleRetry} variant="outline" size="sm">
                        Retry Widget
                    </Button>
                </Card>
            );
        }
        return this.props.children;
    }
}

// Backward compatibility alias
export const ErrorBoundary = ApplicationErrorBoundary;
