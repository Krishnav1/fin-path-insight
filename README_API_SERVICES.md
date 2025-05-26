# API & Service Layer Structure

This project uses a unified, TypeScript-based service layer for all API and database access. This ensures type safety, maintainability, and clarity for all contributors.

## Service File Organization

| File                                      | Purpose                                 | Export Style     |
|--------------------------------------------|-----------------------------------------|------------------|
| `src/lib/api-service.ts`                   | External/public market data APIs        | Named exports    |
| `src/services/apiService.ts`               | FastAPI proxy & fallback market APIs    | Named exports    |
| `src/services/supabaseService.ts`          | Supabase DB access/services             | Named exports    |
| `src/services/company-service.ts`          | Company-specific DB/API logic           | Named exports    |
| `src/services/portfolio-service.ts`        | Portfolio-related DB/API logic          | Named exports    |
| `src/services/finwell-service.ts`          | FinWell budgeting/net worth logic       | Named exports    |

## Importing Services

- **Always use named imports:**
  ```ts
  import { getPeerComparison } from '@/services/apiService';
  import { stocksService, userService } from '@/services/supabaseService';
  ```
- **Do not use default or namespace imports for service modules.**

## Migration Notes
- All legacy `.js` service files have been converted to `.ts`.
- All default exports have been removed from service files. Use named exports only.
- Redundant and unused service files have been removed.
- All references in the codebase have been updated to use the new import paths and named imports.

## Adding New Services
- Place new service modules in `src/services/` or `src/lib/` as appropriate.
- Use TypeScript and named exports.
- Document major functions using JSDoc style comments.

---

For questions, contact the maintainers or review the latest code in `src/services/`.
