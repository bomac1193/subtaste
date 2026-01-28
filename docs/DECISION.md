# DECISION.md — Phase 2 Architectural Decision

**Date:** 2026-01-26
**Decision Maker:** Claude Code
**Status:** APPROVED

---

## DECISION: Option C — Full Reconstruction

### Selected Architecture

Rebuild subtaste from first principles using THE TWELVE system as the foundational schema. This is not an incremental enhancement but a purposeful reconstruction around the PANTHEON architecture.

---

## DECISION RATIONALE

### Scoring Matrix

| Criterion | Weight | Option A | Option B | Option C | Notes |
|-----------|--------|----------|----------|----------|-------|
| **Time to MVP** | 25% | 9 | 6 | 7 | A fastest, but C achievable with focused scope |
| **Differentiation** | 30% | 4 | 6 | 10 | C delivers uncopiable moat |
| **Cross-app Portability** | 20% | 5 | 8 | 9 | C cleanest SDK from start |
| **Revenue Potential** | 15% | 5 | 7 | 9 | C positions for B2B licensing |
| **User Experience** | 10% | 6 | 5 | 9 | C coherent profiling journey |
| **WEIGHTED TOTAL** | 100% | **5.65** | **6.45** | **8.95** | **Option C wins** |

### Why Not Option A (Enhancement Layer)?

The fundamental problem: **8 does not map to 12.**

Attempting to overlay THE TWELVE onto the existing VESPYR/IGNYX/etc. system creates:
- Awkward 2:3 mapping ratios
- Inconsistent psychometric foundations
- No clean place for Sephirotic/Orisha engine weights
- Technical debt from day one

The existing archetypes have different design principles (viral social shareability, emoji-led identity) than THE TWELVE (mythic authority, progressive revelation, hidden depth). Forcing them together dilutes both.

### Why Not Option B (Parallel Systems)?

Running two archetype systems creates:
- Ongoing maintenance burden
- User confusion ("Am I a VESPYR or a CULL?")
- API complexity (which system does the caller want?)
- Eventual migration anyway

Parallel systems are appropriate when you have paying customers on the legacy system. Subtaste does not have external API consumers that would break.

### Why Option C?

1. **Clean Architecture:** THE TWELVE is the single source of truth
2. **Hidden Layers Work:** Psychometric/esoteric mappings integrate naturally
3. **Progressive Reveal Native:** Glyph → Sigil → Designation flows are first-class
4. **SDK-First:** Build for portability from the start
5. **No Legacy Debt:** Every decision optimises for the target state

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Existing user data lost | Export profiles before migration; offer "legacy archive" |
| Ship time exceeds 2 weeks | Scope to core only; defer API package to phase 2 |
| Refyn integration delayed | Refyn continues standalone; SDK adapter added later |
| Psychometric validity | Use established Big Five/MUSIC research; validate post-launch |

---

## SCOPE DEFINITION

### MVP Scope (Ship Target)

**In Scope:**
- `@subtaste/core` package with PANTHEON definitions
- TasteGenome schema and types
- Classification engine (signals → archetype)
- Psychometric scoring (Big Five Openness facets + MUSIC)
- Hidden engine layer (Sephirotic/Orisha weights — internal only)
- Basic profiler with 3-question onboarding
- REST API endpoints for profile operations

**Deferred:**
- `@subtaste/sdk` React hooks
- `@subtaste/api` standalone service
- Refyn adapter
- Multi-context profiles (phase 2)
- Bayesian updating (phase 2)
- B2B API licensing layer (phase 3)

### Data Migration Strategy

1. **Export Window:** Users can export current profile to JSON
2. **Reprofiling Encouraged:** New quiz positions THE TWELVE as "evolved assessment"
3. **Legacy Archive:** Old profiles preserved in `ProfileHistory` with `trigger: 'migration'`
4. **No Mapping:** Do not attempt to map VESPYR → KETH etc. Start fresh.

---

## IMPLEMENTATION ARCHITECTURE

### Package Structure

```
subtaste/
├── packages/
│   ├── core/                  # THE TWELVE + scoring (MVP)
│   │   ├── src/
│   │   │   ├── types/         # Genome, Archetype, Signal types
│   │   │   ├── pantheon/      # PANTHEON definitions
│   │   │   │   ├── definitions.ts  # Public archetypes
│   │   │   │   └── internal.ts     # Sephirotic/Orisha (NEVER EXPORT)
│   │   │   ├── engine/        # Classification logic
│   │   │   │   ├── classifier.ts
│   │   │   │   ├── psychometrics.ts
│   │   │   │   └── weights.ts
│   │   │   └── genome/        # TasteGenome operations
│   │   └── package.json
│   │
│   └── profiler/              # Assessment instruments (MVP)
│       ├── src/
│       │   ├── instruments/   # initial, calibration
│       │   ├── questions/     # Question bank + mappings
│       │   └── progressive/   # Stage orchestration
│       └── package.json
│
├── src/                       # Next.js app (updated to use packages)
│   ├── app/api/               # REST endpoints
│   └── lib/                   # Adapters to @subtaste/core
│
├── docs/
│   ├── ANALYSIS.md
│   ├── DECISION.md
│   └── ARCHITECTURE.md
│
└── pnpm-workspace.yaml
```

### Key Design Decisions

**1. Three-Register Naming**
```typescript
// User sees Glyph first, always
"You are CULL."

// Sigil revealed on request
"Your formal classification: Severis"

// Designation for power users only
"C-4"
```

**2. Hidden Layer Architecture**
```typescript
// PUBLIC (client-safe)
interface ArchetypePublic {
  designation: Designation;  // 'C-4'
  glyph: Glyph;              // 'CULL'
  sigil: Sigil;              // 'Severis' (revealed on request)
  essence: string;
  creativeMode: CreativeMode;
  shadow: string;
}

// INTERNAL (server-only, never bundled for client)
interface ArchetypeInternal extends ArchetypePublic {
  _engine: {
    sephirah: Sephirah;
    orisha: Orisha;
    shadowOrisha: Orisha;
    psychometricWeights: PsychometricWeights;
  };
}
```

**3. Psychometric Foundation**
- Big Five Openness sub-facets: Fantasy, Aesthetics, Feelings, Actions, Ideas, Values
- MUSIC model: Mellow, Unpretentious, Sophisticated, Intense, Contemporary
- Both hidden from users — powers engine only

**4. Progressive Profiling**
```
Stage 1: Initial Spark (onboarding)
├─ 3 binary questions
├─ ~30 seconds
└─ Sufficient for primary Glyph assignment

Stage 2: Music Calibration (milestone trigger)
├─ 3 Likert questions
├─ Triggered after 5 interactions
└─ Refines MUSIC dimensions

Stage 3: Deep Calibration (on-demand)
├─ Ranking + extended questions
├─ ~2 minutes
└─ Unlocks confidence boost
```

**5. Scoring Algorithm**
```
Input: Signal[]
    ↓
applySignal() per signal type
    ↓
Psychometric weights from INTERNAL_MAPPINGS
    ↓
Softmax with configurable temperature
    ↓
Output: {
  primary: { designation, glyph, confidence },
  secondary: { designation, glyph, confidence } | null,
  distribution: Record<Designation, probability>
}
```

---

## SUCCESS CRITERIA

### MVP Complete When:

1. **PANTHEON defined:** All 12 archetypes with Designation/Glyph/Sigil
2. **Hidden layers implemented:** Sephirotic/Orisha weights power scoring
3. **Classification works:** User answers → Glyph assignment
4. **Progressive reveal:** Sigil endpoint exists and tracks reveal
5. **3Q onboarding:** Minimal viable assessment ships
6. **Types exported:** `@subtaste/core` is importable

### Quality Gates:

- [ ] `internal.ts` not importable from client bundle
- [ ] All 12 archetypes have distinct psychometric weight profiles
- [ ] Scoring produces meaningful distribution (not all equal)
- [ ] UK English throughout
- [ ] No emojis in production code or copy

---

## EXECUTION PLAN

### Immediate Next Steps (Phase 3)

1. Initialise pnpm workspace structure
2. Create `@subtaste/core` package scaffold
3. Implement PANTHEON definitions (all 12)
4. Implement internal mappings (Sephirotic/Orisha)
5. Build classification engine
6. Create profiler with 3Q onboarding
7. Wire REST API endpoints
8. Update README with strategic section

### Deferred to Phase 2

- Multi-context profiles
- Bayesian updating
- SDK React hooks
- Refyn adapter

### Deferred to Phase 3

- B2B API licensing
- Standalone API service
- Cross-modal embeddings

---

## SIGN-OFF

This decision commits subtaste to a full reconstruction around THE TWELVE. The existing 8-archetype system will be deprecated. User profiles will require reprofiling.

This is the correct path because:
1. The target differentiation requires architectural purity
2. The current system has no external dependencies that would break
3. Ship time is achievable with focused MVP scope
4. The hidden layer architecture cannot be retrofitted cleanly

**Decision: PROCEED WITH OPTION C**

---

*Proceed to Phase 3: Implementation*
