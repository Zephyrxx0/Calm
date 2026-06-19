# Phase 4: Social & Sharing - Research

**Researched:** 2026-06-19
**Domain:** Social Features, Daily Tracking, Broadsheet Export, Multi-Format Sharing
**Confidence:** HIGH

## Summary

This phase transforms Calm from an ephemeral interview experience into a daily habit tracker with social accountability. The core challenge is introducing Firebase Auth (breaking the "no accounts" principle) while maintaining the organic, unhurried aesthetic through crayon-drawn contribution graphs and true newspaper-quality exports.

**Primary recommendation:** Use **Firebase Auth v10** with email-only signup, **react-calendar-heatmap** as foundation with custom organic SVG rendering, and **CSS multi-column layout** for true 11"×17" broadsheet dimensions in exports.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User Authentication | Frontend (Firebase SDK) | Backend (Firebase Admin) | Firebase client handles auth state; backend verifies tokens |
| Daily Tracking UI | Browser / Client | — | GitHub-style contribution graph is client-rendered |
| Streak Persistence | API / Backend | Database | PostgreSQL stores daily entries linked to Firebase UIDs |
| Broadsheet Export | Browser / Client | — | CSS multi-column + html-to-image for true newspaper layout |
| Social Card Generation | Frontend Server (SSR) | — | Extends existing next/og implementation from Phase 3 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase` | 10.13.1 | Authentication | Standard web auth solution; excellent Next.js integration |
| `react-calendar-heatmap` | 1.9.0 | Contribution Graph Base | Battle-tested GitHub-style calendar grid |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|----------|-------------|
| `date-fns` | 2.30.0 | Date calculations | Streak calculations, calendar logic |

### Existing (Reuse)
| Library | Purpose | Phase | Notes |
|---------|---------|-------|-------|
| `html-to-image` | Export Generation | 3 | Extend for broadsheet dimensions |
| `jspdf` | PDF Creation | 3 | Multi-page support for broadsheet |
| `recharts` | Organic Charts | 3 | Pattern for streak visualization |

**Installation:**
```bash
# Frontend
pnpm add firebase react-calendar-heatmap date-fns

# Backend  
pip install firebase-admin
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `firebase` | npm | 11 yrs | ~3.8M/wk | github.com/firebase/firebase-js-sdk | [OK] | Approved |
| `react-calendar-heatmap` | npm | 8 yrs | ~50k/wk | github.com/kevinsqi/react-calendar-heatmap | [OK] | Approved |
| `firebase-admin` | pypi | 8 yrs | ~800k/wk | github.com/firebase/firebase-admin-python | [OK] | Approved |

## Architecture Patterns

### System Architecture Diagram

```mermaid
graph TD
    User((User)) -->|Signs In| FirebaseAuth[Firebase Auth]
    User -->|Daily Entry| DailyForm[Quick Daily Form]
    User -->|Views History| ContribGraph[Contribution Graph]
    
    subgraph Frontend (Next.js)
        FirebaseAuth -->|Auth State| AuthContext[Auth Context Provider]
        DailyForm -->|Saves Entry| DailyAPI[POST /api/daily]
        ContribGraph -->|Renders| OrganicHeatmap[Organic Calendar Heatmap]
        OrganicHeatmap -->|Custom Shapes| OrganicDoodles[OrganicDoodles.tsx]
    end
    
    subgraph Backend (FastAPI)
        DailyAPI -->|Verifies Token| FirebaseAdmin[Firebase Admin SDK]
        DailyAPI -->|Stores Entry| PostgreSQL[(PostgreSQL)]
        BroadsheetExport[Broadsheet Export] -->|CSS Multi-column| NewspaperLayout[11"x17" Layout]
    end
    
    AuthContext -->|UID| DailyAPI
    PostgreSQL -->|Daily Entries| ContribGraph
```

### Recommended Project Structure
```
frontend/src/
├── lib/
│   └── firebase.ts              # [NEW] Firebase client config
├── contexts/
│   └── AuthContext.tsx          # [NEW] Firebase auth state management  
├── components/
│   ├── auth/
│   │   ├── SignInModal.tsx      # [NEW] Email/password auth UI
│   │   └── AuthButton.tsx       # [NEW] Sign In / Account menu
│   ├── daily/
│   │   ├── DailyForm.tsx        # [NEW] 6-7 question quick form
│   │   └── ContributionGraph.tsx # [NEW] GitHub-style calendar with organic styling
│   └── broadsheet/
│       └── NewspaperLayout.tsx  # [NEW] True 11"x17" newspaper layout
└── app/
    ├── daily/
    │   └── page.tsx             # [NEW] Daily tracking dashboard
    └── api/
        └── daily/
            └── route.ts         # [NEW] Daily entry CRUD operations

backend/app/
├── auth/
│   └── firebase_auth.py         # [NEW] Firebase Admin SDK integration
├── models/
│   ├── daily_entry.py           # [NEW] Daily tracking model
│   └── user.py                  # [NEW] Firebase UID-linked user model  
└── api/
    └── daily.py                 # [NEW] Daily tracking endpoints
```

### Pattern 1: Firebase Auth Integration
**What:** Client-side Firebase SDK for auth flows, server-side Admin SDK for token verification
**When to use:** All authenticated operations (daily entries, streak data)
**Example:**
```typescript
// Client-side auth context
const AuthContext = createContext<{user: User | null}>({user: null});
export const useAuth = () => useContext(AuthContext);

// Server-side token verification
async function verifyFirebaseToken(token: string): Promise<string> {
  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken.uid;
}
```

### Pattern 2: Organic Contribution Graph
**What:** react-calendar-heatmap base + OrganicDoodles custom rect renderer
**When to use:** Daily streak visualization with Calm aesthetic
**Example:**
```tsx
<CalendarHeatmap
  values={dailyEntries}
  rectRender={(props, value) => (
    <OrganicSquare 
      {...props} 
      intensity={value?.intensity || 0}
      className="crayon-drawn"
    />
  )}
/>
```

### Pattern 3: True Broadsheet Layout
**What:** CSS Multi-column layout with 11"×17" dimensions and newspaper typography
**When to use:** Export functionality requiring actual newspaper proportions
**Example:**
```css
@media print {
  .broadsheet {
    width: 17in;
    height: 11in;
    columns: 4;
    column-gap: 0.5in;
    font-family: 'Times New Roman', serif;
  }
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication flows | Custom JWT system | Firebase Auth | Handles edge cases, cross-device sync, password reset |
| Calendar grid layout | Custom date calculations | react-calendar-heatmap | Handles leap years, timezone edge cases, accessibility |
| Multi-column layout | JavaScript column balancing | CSS Multi-column | Browser-optimized, print-friendly, responsive |

## Common Pitfalls

### Pitfall 1: Firebase Auth hydration mismatch
**What goes wrong:** Next.js SSR shows signed-out state, then client shows signed-in, causing flash
**Why it happens:** Firebase auth state is async and not available during SSR
**How to avoid:** Use loading states and `onAuthStateChanged` in useEffect, never render auth-dependent UI on first render

### Pitfall 2: Contribution graph performance with large datasets
**What goes wrong:** 365+ daily entries cause rendering lag on contribution graph
**Why it happens:** Too many DOM nodes, inefficient re-renders
**How to avoid:** Virtualization for large date ranges, memoize contribution squares, use CSS transforms over layout changes

### Pitfall 3: Broadsheet layout breaking across browsers
**What goes wrong:** Multi-column CSS renders differently in Chrome vs Firefox vs Safari
**Why it happens:** CSS Multi-column support varies between browsers
**How to avoid:** Test thoroughly, provide fallback single-column layout, use feature detection

## Code Examples

### Firebase Auth Context
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export const app = initializeApp({
  // Only email auth, minimal config per D-31
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

export const auth = getAuth(app);
```

### Daily Entry Model (Backend)
```python
# models/daily_entry.py
class DailyEntry(Base):
    __tablename__ = "daily_entries"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    firebase_uid: Mapped[str] = mapped_column(String(128), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    transport_mode: Mapped[str] = mapped_column(String(50))
    meals_count: Mapped[int]
    energy_usage: Mapped[str] = mapped_column(String(50))
    carbon_consciousness: Mapped[int] = mapped_column(nullable=False)  # 1-5 scale
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    
    __table_args__ = (
        UniqueConstraint('firebase_uid', 'date', name='one_entry_per_day'),
    )
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session-based auth | Firebase Auth | 2023+ | Cross-device sync, persistent login |
| Custom calendar grids | react-calendar-heatmap | 2020+ | Better accessibility, less custom code |
| PDF libraries for layout | CSS Multi-column + html-to-image | 2022+ | True browser rendering, better typography |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Firebase Auth free tier sufficient for MVP | Core Stack | Cost increase if daily active users exceed 10k |
| A2 | CSS Multi-column stable across browsers | Pattern 3 | Layout issues in older browsers |
| A3 | Daily form takes <30 seconds | UI Spec | User abandonment if longer |

## Open Questions (RESOLVED)

1. **Account Migration:** (RESOLVED) Use Firebase UID as foreign key in all tables. Sessions become user-linked rather than ephemeral.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Firebase Auth | Daily tracking | ✓ | v10.x | Local storage (dev only) |
| PostgreSQL | Persistence | ✓ | 15.x | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Pytest + Firebase Emulator |
| Config file | `frontend/vitest.config.ts` / `firebase.json` |
| Quick run command | `firebase emulators:start --only auth,firestore` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-04-01 | Firebase auth signup/signin | integration | `vitest frontend/tests/Auth.test.tsx` | ❌ Wave 0 |
| REQ-04-02 | Daily entry form submission | unit | `vitest frontend/tests/DailyForm.test.tsx` | ❌ Wave 0 |
| REQ-04-03 | Contribution graph rendering | component | `vitest frontend/tests/ContributionGraph.test.tsx` | ❌ Wave 0 |
| REQ-04-04 | Broadsheet export layout | integration | `vitest frontend/tests/BroadsheetExport.test.tsx` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Firebase Auth handles password policy, brute force, session management |
| V3 Session Management | yes | Firebase JWT tokens with 1-hour expiry |
| V4 Access Control | yes | Verify Firebase UID in all daily entry operations |

### Known Threat Patterns for Firebase + Next.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Token Tampering | Tampering | Verify all tokens server-side with Firebase Admin SDK |
| Account Enumeration | Information Disclosure | Firebase Auth handles timing attacks on email lookup |
| Cross-Device Session Hijacking | Spoofing | Firebase automatically invalidates sessions on password change |

## Sources

### Primary (HIGH confidence)
- [Firebase Auth Documentation] - Next.js integration patterns
- [CSS Multi-column Layout MDN] - Browser support and best practices
- [react-calendar-heatmap GitHub] - API and customization options

### Secondary (MEDIUM confidence)
- [GitHub Contribution Graph Analysis] - Visual design patterns
- [Newspaper Layout CSS Examples] - Multi-column typography

## Metadata

**Confidence breakdown:**
- Firebase integration: HIGH - Well-documented, widely used
- Contribution graph: HIGH - Established libraries and patterns
- Broadsheet layout: MEDIUM - CSS Multi-column has browser quirks
- Social sharing: HIGH - Builds on Phase 3 infrastructure

**Research date:** 2026-06-19
**Valid until:** 2026-07-19