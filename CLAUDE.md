# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Avalia 360°** is an enterprise-grade 360-degree evaluation system where managers create evaluations, invite teams, and track results securely. In a 360° evaluation, **everyone evaluates everyone else** - providing comprehensive, multi-dimensional performance feedback.

### Key Characteristics
- **Security-first**: AES-256 encryption for sensitive data, SHA-256 hashing for emails/codes, UUID tokens
- **Privacy**: Complete anonymity - managers cannot see who evaluated whom
- **Multi-language**: Portuguese, English, and Spanish (i18next)
- **Real-time**: Firebase Firestore for live progress tracking
- **Excel integration**: Import team members via XLSX uploads
- **Automated emails**: EmailJS for invitation delivery

## Development Commands

### Essential Commands

```bash
# Development server (Vite)
npm run dev                    # Start dev server at http://localhost:5173

# Build and preview
npm run build                  # TypeScript compile + Vite build
npm run preview                # Preview production build locally

# Linting
npm run lint                   # ESLint with TypeScript rules
npx tsc --noEmit              # Type checking without emitting files

# Testing - Unit Tests (Vitest)
npm test                       # Watch mode for development
npm run test:run              # Run all tests once
npm run test:ui               # Vitest UI interface
npm run test:coverage         # Generate coverage report (80% threshold)

# Testing - E2E Tests (Playwright)
npm run test:e2e              # Headless mode
npm run test:e2e:ui           # Playwright UI interface
npm run test:e2e:headed       # See browser while testing
npm run test:e2e:debug        # Debug mode with step-through
npm run test:e2e:report       # View latest test report

# Run all tests
npm run test:all              # Unit + E2E tests

# Security
npm run security:audit        # Custom security audit script
npm run security:check        # NPM audit (moderate+ level)
npm run security:fix          # Auto-fix vulnerabilities

# Firebase deployment
firebase deploy --only hosting    # Deploy to Firebase hosting
```

### Running Single Tests

```bash
# Unit test - specific file
npm test -- src/utils/crypto.test.ts

# Unit test - specific test name
npm test -- -t "should encrypt and decrypt correctly"

# E2E test - specific file
npm run test:e2e -- manager-flow.spec.ts

# E2E test - specific test name
npm run test:e2e -- -g "should create evaluation successfully"
```

## Architecture Overview

### Clean Architecture Principles

This codebase follows strict separation of concerns:

```
src/
├── components/        # UI components (presentation only)
│   ├── gestor/       # Manager-specific components
│   ├── colaborador/  # Member/collaborator components
│   ├── shared/       # Reusable components (ErrorBoundary, Toast, etc.)
│   └── layout/       # Layout components (Card, PageLayout)
├── services/         # Business logic and external integrations
│   ├── firebase/     # Firestore CRUD operations (evaluation, member, response)
│   ├── email/        # EmailJS integration
│   ├── security/     # Rate limiting, CSRF protection
│   ├── observability/# Logging, monitoring, error tracking
│   ├── resilience/   # Circuit breakers, retry logic
│   └── debug/        # Debug utilities
├── utils/           # Pure utility functions
│   ├── crypto.ts    # AES-256 encryption, SHA-256 hashing
│   ├── validation.ts # Input validation (OWASP compliant)
│   ├── sanitization.ts # XSS/injection prevention
│   ├── session.ts   # Session management
│   └── excel.ts     # XLSX parsing/generation
├── hooks/           # Custom React hooks
├── pages/           # Page-level components (ManagerPage, MemberPage)
├── types/           # TypeScript type definitions
├── i18n/            # i18next configuration
└── locales/         # Translation files (pt, en, es)
```

**Critical Rule**: NEVER mix API calls or business logic inside components. Always extract to services/ or hooks/.

### Data Flow Architecture

**Manager Flow:**
1. Creates evaluation (services/firebase/evaluation.service.ts)
2. Adds team members (services/firebase/member.service.ts)
3. System generates unique access codes per member
4. EmailJS sends invitations (services/email/emailjs.service.ts)
5. Tracks progress via Firestore real-time listeners
6. Views consolidated results when all complete

**Member Flow:**
1. Receives email with 6-digit access code
2. Logs in (validates via SHA-256 hash comparison)
3. Evaluates all other team members (N-1 evaluations)
4. Can save partial progress (draft system in services/draft.ts)
5. Submits encrypted responses (services/firebase/response.service.ts)

### Security Architecture

**Encryption Strategy:**
- **AES-256-GCM**: Names, titles, comments, ratings (utils/crypto.ts)
- **SHA-256**: Email addresses, access codes (one-way hashing)
- **UUID v4**: Manager authentication tokens
- **Timing-safe comparisons**: Prevent timing attacks

**Key Security Services:**
- `utils/validation.ts`: Input validation (48 tests)
- `utils/sanitization.ts`: XSS/injection prevention with DOMPurify (70 tests)
- `utils/session.ts`: Session management with expiration (34 tests)
- `services/security/rateLimit.ts`: In-memory rate limiting

**OWASP Top 10 Compliance:**
- A01: Access control via tokens/codes
- A02: Cryptographic failures - AES-256 encryption
- A03: Injection - DOMPurify + input validation
- A04: Insecure design - secure session management
- A07: Identification failures - SHA-256 + rate limiting
- A08: Integrity failures - config verification (utils/integrity.ts)
- A09: Logging failures - structured logging (services/observability/logger.ts)

### Firebase Collections Structure

```
firestore/
├── avaliations/          # Evaluation metadata
│   └── {evaluationId}
│       ├── id: string
│       ├── creator_email: string (SHA-256 hash)
│       ├── creator_token: string (encrypted UUID)
│       ├── title: string (encrypted)
│       ├── status: 'draft' | 'active' | 'completed'
│       └── created_at: timestamp
├── team_members/         # Team members per evaluation
│   └── {memberId}
│       ├── evaluation_id: string (FK)
│       ├── name: string (encrypted)
│       ├── email: string (SHA-256 hash)
│       ├── access_code: string (SHA-256 hash of 6 digits)
│       ├── completed_evaluations: number
│       └── total_evaluations: number (N-1)
├── responses/            # 360° evaluation responses
│   └── {responseId}
│       ├── evaluation_id: string (FK)
│       ├── evaluator_id: string (FK - who is evaluating)
│       ├── evaluated_id: string (FK - who is being evaluated)
│       ├── question_1-4: number (encrypted ratings 1-5)
│       ├── positive_points: string (encrypted)
│       └── improvement_points: string (encrypted)
└── application_logs/     # Write-only security logs
```

**Important**: Never store sensitive data unencrypted. Always use crypto utilities before Firestore writes.

## Design System

### Tailwind CSS Conventions

**Color Palette:**
- Primary (Manager): `from-blue-600 via-indigo-600 to-purple-600`
- Secondary (Member): `from-emerald-500 via-teal-500 to-cyan-500`
- Success: `from-green-400 to-emerald-500`
- Error: `from-red-400 to-rose-500`
- Warning: `from-amber-400 to-orange-500`

**Rating Colors (1-5 scale):**
- 1 - Below Expectation: `text-red-500`
- 2 - Improving: `text-orange-500`
- 3 - Meets Expectations: `text-yellow-500`
- 4 - Above Expectations: `text-green-500`
- 5 - Role Model: `text-emerald-500`

**Component Patterns:**

```tsx
// Modern button
<button className="
  px-6 py-3
  rounded-2xl
  bg-gradient-to-r from-blue-600 to-indigo-600
  text-white font-medium
  hover:scale-[1.02] hover:shadow-xl
  active:scale-[0.98]
  transition-all duration-200
">

// Card with shadow
<div className="
  bg-white
  rounded-3xl
  shadow-lg
  p-6
  hover:shadow-xl
  transition-shadow
">

// Loading spinner
<div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent">
```

### i18n (Internationalization)

**Translation Keys Structure:**
- `common.*`: Shared across all pages
- `home.*`: Landing page
- `manager.*`: Manager-specific UI
- `member.*`: Member-specific UI
- `evaluation.*`: Evaluation forms and results

**Usage:**
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('manager.dashboard.title')}</h1>;
}
```

**Supported Languages:**
- `pt`: Portuguese (default)
- `en`: English
- `es`: Spanish

Translation files: `src/locales/{lang}/translation.json`

## Performance Considerations

### Big O Complexity Rules

**NEVER** write O(N²) or worse in hot paths. This project enforces O(N) or better:

```typescript
// ❌ BAD - O(N²)
members.forEach(m1 => {
  members.forEach(m2 => {
    if (m1.email === m2.email) { ... }
  });
});

// ✅ GOOD - O(N) with Set
const seen = new Set<string>();
const duplicates = members.filter(m => {
  if (seen.has(m.email)) return true;
  seen.add(m.email);
  return false;
});
```

### React Performance

- Use `React.memo()` for list items (e.g., MembersList)
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for event handlers passed to children
- Lazy load pages with `React.lazy()` (already configured in App.tsx)

### Vite Build Optimization

Manual chunk splitting configured in `vite.config.ts`:
- `react-vendor`: React core libraries
- `firebase-vendor`: Firebase SDK
- `ui-vendor`: Lucide icons + Framer Motion
- `form-vendor`: React Hook Form + Zod

## Testing Strategy

### Unit Tests (Vitest)

**Coverage Requirements:**
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

**Test Files:**
- `*.test.ts` for utilities
- `*.test.tsx` for components

**Key Test Suites:**
- `crypto.test.ts`: 22 tests - encryption/decryption/hashing
- `validation.test.ts`: 48 tests - input validation
- `sanitization.test.ts`: 70 tests - XSS/injection prevention
- `session.test.ts`: 34 tests - session lifecycle
- Total: 174+ unit tests

### E2E Tests (Playwright)

**Test Coverage:**
- Manager flow: Create → Add members → Send invites → Track progress → View results
- Member flow: Login → Evaluate team → Save progress → Complete
- Excel upload: Download template → Fill → Upload → Validate
- Edge cases: Validation, authentication failures, rate limiting

**Running E2E Locally:**
1. Tests auto-start dev server (`npm run dev`) via Playwright config
2. Run in headed mode to debug: `npm run test:e2e:headed`
3. Use debug mode for step-through: `npm run test:e2e:debug`

## Important Files

### Configuration
- `vite.config.ts`: Vite build + dev server + alias configuration
- `vitest.config.ts`: Unit test configuration (jsdom, coverage)
- `playwright.config.ts`: E2E test configuration
- `tailwind.config.js`: Design system tokens
- `tsconfig.json`: TypeScript strict mode configuration

### Environment Variables
Required in `.env` (see `.env.example`):
```bash
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# EmailJS
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...        # Portuguese template
VITE_EMAILJS_TEMPLATE_ID_EN=...     # English template
VITE_EMAILJS_TEMPLATE_ID_ES=...     # Spanish template
VITE_EMAILJS_PUBLIC_KEY=...
```

### Security Scripts
- `scripts/security-audit.js`: Custom security auditing
- `scripts/smart-audit.cjs`: Smart dependency auditing

## Critical Development Rules (from Copilot Instructions)

These 12 principles are **mandatory** for all code changes:

### 1. Clean Architecture
- Separate UI (components/) from business logic (services/)
- Extract pure functions to utils/
- Create custom hooks for React logic
- NEVER mix API calls inside components

### 2. Performance (Big O)
- NEVER write O(N²) or worse
- Use Set/Map for lookups instead of nested loops
- Memoize expensive calculations
- Use React.memo for list items

### 3. Security (CVE Mitigation)
- Always validate inputs (utils/validation.ts)
- Sanitize HTML with DOMPurify (utils/sanitization.ts)
- NEVER use `dangerouslySetInnerHTML` without sanitization
- Hash passwords/tokens with SHA-256
- Encrypt sensitive data with AES-256

### 4. Resilience & Cache
- Add retry logic with exponential backoff for critical operations
- Cache expensive queries (5-minute TTL recommended)
- Use circuit breakers for external services

### 5. Modern Design
- Use Tailwind CSS classes consistently
- Follow gradient patterns (Manager: blue/indigo, Member: emerald/teal)
- Rounded corners: `rounded-2xl` or `rounded-3xl`
- Shadows: `shadow-lg` with `hover:shadow-xl`

### 6. Testing
- Write tests alongside code (not after)
- Unit test all utilities with edge cases
- E2E test critical user flows

### 7. Encryption
- Use existing crypto utilities (utils/crypto.ts)
- Encrypt: names, titles, comments, ratings
- Hash: emails, access codes
- NEVER store sensitive data in plaintext

### 8. Observability
- Log critical operations (services/observability/logger.ts)
- Use structured logging with context
- Measure performance with metrics
- Track errors with stack traces

### 9. Design System Tokens
- Use consistent colors from Tailwind config
- Follow spacing multiples of 4 (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px)
- Rating colors: 1=red, 2=orange, 3=yellow, 4=green, 5=emerald

### 10. Development Phases
- Consult PLANO.md (6,275 lines) for detailed implementation plan
- Respect phase order
- Don't implement features out of sequence

### 11. Documentation
- Add JSDoc for complex functions
- Include Big O complexity in comments
- Provide usage examples
- Document security considerations

### 12. Build Integrity
- NEVER break TypeScript build
- Include all necessary imports
- Respect ESLint rules
- No deprecated APIs

## Prohibited Patterns

**NEVER use:**
1. `any` type (use `unknown` if needed)
2. `console.log` (use `logger` from services/observability/logger.ts)
3. Nested loops in hot paths
4. Direct state mutation
5. useEffect without cleanup
6. Firestore queries without indexes
7. Regex without size validation (ReDoS prevention)
8. Synchronous blocking operations
9. Magic numbers (use constants)
10. Duplicated code (extract to function)

## Recommended Patterns

**ALWAYS use:**
1. TypeScript strict mode
2. Pure functions when possible
3. Destructuring for readability
4. Early returns (less nesting)
5. `const` over `let`/`var`
6. Arrow functions for callbacks
7. Template literals over concatenation
8. Optional chaining (`?.`) and nullish coalescing (`??`)
9. `async/await` over `.then()`
10. Named exports over default

## Path Aliases

TypeScript/Vite path alias configured:
```typescript
import { encrypt } from '@/utils/crypto';
import { logger } from '@/services/observability/logger';
import type { TeamMember } from '@/types';
```

`@/` resolves to `./src/`

## Common Debugging

### Firestore Rules Issues
If getting permission errors, check Firebase Console → Firestore → Rules.
Rules file location: `.firebaserc` (example provided)

### EmailJS Not Sending
1. Verify `.env` has correct template IDs for all languages
2. Check EmailJS dashboard for quota (200 emails/month free)
3. Ensure templates use correct variable names: `{{to_name}}`, `{{access_code}}`, etc.

### Type Errors
Run `npx tsc --noEmit` to see all TypeScript errors without building.

### Test Failures
- Unit tests: Check mocks in `src/tests/setup.ts`
- E2E tests: Increase timeouts in `playwright.config.ts` if network is slow

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):
1. TypeScript check
2. Security audit
3. Unit tests
4. Build
5. Deploy to Firebase Hosting
6. Deploy to GitHub Pages

**Secrets required** (GitHub repo settings):
- All `VITE_*` environment variables
- `FIREBASE_SERVICE_ACCOUNT` (JSON)
- `FIREBASE_PROJECT_ID`

## Project Status

**Current Implementation:**
- ✅ Phase 1.1: Setup complete (React 18, TypeScript, Vite, Tailwind, Firebase, EmailJS)
- ✅ Phase 1.2: Authentication & security (validation, sanitization, session management)
- ✅ Complete i18n implementation across all components

**Key Metrics:**
- 174+ unit tests passing
- E2E tests covering full user flows
- 80% code coverage requirement
- 12 mandatory development principles

## Additional Resources

- **User Documentation**: `README.md` (968 lines)
- **Technical Plan**: `PLANO.md` (6,275 lines) - comprehensive implementation guide
- **Copilot Instructions**: `.github/copilot-instructions.md` - detailed coding standards
