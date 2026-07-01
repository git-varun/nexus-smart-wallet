# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-journey.spec.ts >> E2E Production Smart Wallet Journey >> Execute complete lifecycle verification
- Location: production-journey.spec.ts:12:3

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:3001
Call log:
  - → POST http://localhost:3001/api/auth/register
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 100

```