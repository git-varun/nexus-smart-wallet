/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem('nexus-theme');
        return (stored as Theme) || 'dark'; // Default to dark first
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('nexus-theme', newTheme);
    };

    useEffect(() => {
        const root = window.document.documentElement;
        
        const updateTheme = () => {
            let activeTheme: 'light' | 'dark' = 'dark';
            
            if (theme === 'system') {
                const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                activeTheme = systemIsDark ? 'dark' : 'light';
            } else {
                activeTheme = theme;
            }
            
            setResolvedTheme(activeTheme);
            
            root.classList.remove('light', 'dark');
            root.classList.add(activeTheme);
        };

        updateTheme();

        // Listen for system preference changes
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = () => updateTheme();
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
