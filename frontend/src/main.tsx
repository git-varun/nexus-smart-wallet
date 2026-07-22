// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/app/index.css'
import { env } from '@/config/env'

async function startupSelfTest() {
    try {
        const response = await fetch(`${env.API_BASE_URL}/api/health`, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Health check failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error("Backend health check failed during startup:", error);
        if (env.DEV) {
            document.getElementById('root')!.innerHTML = `
                <div style="color: red; padding: 20px; font-family: monospace;">
                    <h2>Startup Self-Test Failed</h2>
                    <p>Could not connect to the backend API at <strong>${env.API_BASE_URL}</strong>.</p>
                    <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
                    <p>Make sure the backend is running and the VITE_API_BASE_URL is correct.</p>
                </div>
            `;
            throw error; // Stop execution
        }
    }
}

startupSelfTest().then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App/>
        </React.StrictMode>,
    );
}).catch(() => {
    // Error already handled and displayed to the user
});
