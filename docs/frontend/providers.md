# Context Providers

The React application tree wraps routing and state within a nested tree of context providers inside `App.tsx`.

## 🌲 Provider Hierarchy
```text
ErrorBoundary (Global safety fallback)
  └── ReduxProvider (Global Redux Store)
        └── PersistGate (LocalStorage Session Restorer)
              └── QueryClientProvider (React Query Caching Client)
                    └── ThemeProvider (Dynamic CSS Theme Context)
                          └── ToastProvider (Notification alerts context)
                                └── BrowserRouter (React Router Context)
```

Related Pages:
* [Router Config](routing.md)
* [State & Persist](state-management.md)
