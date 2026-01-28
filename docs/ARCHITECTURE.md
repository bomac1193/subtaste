# ARCHITECTURE.md — Technical Architecture

**Version:** 1.0.0
**Date:** 2026-01-26

---

## Overview

subtaste is a monorepo containing packages for unified taste profiling. The architecture is designed around three principles:

1. **Layered opacity** — Users see archetypes, not statistics
2. **Progressive depth** — Minimal onboarding, optional deep profiling
3. **Cross-app portability** — Shared genome across VIOLET SPHINX ecosystem

---

## Package Structure

```
subtaste/
├── packages/
│   ├── core/                 # @subtaste/core
│   └── profiler/             # @subtaste/profiler
├── src/                      # Next.js application (existing)
├── docs/                     # Documentation
└── pnpm-workspace.yaml       # Monorepo configuration
```

### @subtaste/core

Core taste genome logic. No external dependencies.

```
packages/core/
├── src/
│   ├── types/                # Type definitions
│   │   ├── archetype.ts      # Designation, Glyph, Sigil types
│   │   ├── genome.ts         # TasteGenome structure
│   │   └── signals.ts        # Signal types
│   │
│   ├── pantheon/             # THE TWELVE
│   │   ├── definitions.ts    # Public archetype definitions
│   │   ├── descriptions.ts   # User-facing copy
│   │   ├── internal.ts       # [SERVER ONLY] Sephirotic/Orisha/Psychometric weights
│   │   └── index.ts          # Public exports
│   │
│   ├── engine/               # Classification logic
│   │   ├── classifier.ts     # Signal → Archetype algorithm
│   │   ├── psychometrics.ts  # Big Five/MUSIC scoring
│   │   ├── weights.ts        # Configurable scoring weights
│   │   └── index.ts
│   │
│   ├── genome/               # TasteGenome operations
│   │   ├── schema.ts         # Create, validate, serialise
│   │   ├── encoder.ts        # Signals → Genome
│   │   ├── evolution.ts      # Temporal decay, drift detection
│   │   └── index.ts
│   │
│   ├── context/              # Multi-context profiles
│   │   ├── multi.ts          # Context management
│   │   └── index.ts
│   │
│   └── index.ts              # Main exports
│
└── package.json
```

### @subtaste/profiler

Assessment instruments. Depends on @subtaste/core.

```
packages/profiler/
├── src/
│   ├── instruments/          # Assessment mechanisms
│   │   ├── initial.ts        # 3-question onboarding
│   │   ├── calibration.ts    # Music and deep calibration
│   │   ├── implicit.ts       # Behavioural signal processing
│   │   └── index.ts
│   │
│   ├── questions/            # Question bank
│   │   ├── bank.ts           # Question definitions
│   │   ├── mapping.ts        # Response → Signal conversion
│   │   └── index.ts
│   │
│   ├── progressive/          # Profiling orchestration
│   │   ├── stages.ts         # Stage definitions
│   │   ├── orchestrator.ts   # Flow management
│   │   └── index.ts
│   │
│   └── index.ts              # Main exports
│
└── package.json
```

---

## Data Flow

### 1. Initial Profiling

```
User
  │
  ▼
┌─────────────────────┐
│  Initial Assessment │  3 binary questions
│    (30 seconds)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  responsesToSignals │  Convert to Signal[]
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     classify()      │  Run classification engine
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  encodeSignals      │  Create TasteGenome
│  ToGenome()         │
└──────────┬──────────┘
           │
           ▼
    TasteGenome
    {
      archetype: {
        primary: { glyph: 'CULL', confidence: 0.72 }
      }
    }
```

### 2. Classification Algorithm

```
Input: Signal[]
         │
         ├───────────────────────┐
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ extractTrait    │    │ calculateSignal │
│ Deltas()        │    │ Scores()        │
└────────┬────────┘    └────────┬────────┘
         │                      │
         ▼                      │
┌─────────────────┐             │
│ applyTrait      │             │
│ Deltas()        │             │
└────────┬────────┘             │
         │                      │
         ▼                      │
┌─────────────────┐             │
│ calculate       │             │
│ AllSimilarities │             │
└────────┬────────┘             │
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Combine with  │
            │ psychometric  │
            │ Weight (0.7)  │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │   softmax()   │  temperature=5
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  filter       │  threshold=0.01
            │  Distribution │
            └───────┬───────┘
                    │
                    ▼
         ArchetypeClassification
```

### 3. Behavioural Learning

```
User Action (save, skip, share, etc.)
         │
         ▼
┌─────────────────────┐
│ behaviourToSignal() │  Infer archetype weights from action
└──────────┬──────────┘
         │
         ▼
┌─────────────────────┐
│ orchestrator        │  Buffer signals
│ .recordBehaviour()  │
└──────────┬──────────┘
         │
         ▼ (periodic or on-demand)
┌─────────────────────┐
│ processPending      │
│ Signals()           │
└──────────┬──────────┘
         │
         ▼
┌─────────────────────┐
│ updateGenomeWith    │  Reclassify with new signals
│ Signals()           │
└──────────┬──────────┘
         │
         ▼
    Updated TasteGenome
```

---

## Hidden Layer Architecture

### Sephirotic Correspondences

Each archetype maps to a position on the Kabbalistic Tree of Life:

| Designation | Glyph | Sephirah |
|-------------|-------|----------|
| S-0 | KETH | Keter (Crown) |
| T-1 | STRATA | Chokmah (Wisdom) |
| V-2 | OMEN | Binah (Understanding) |
| L-3 | SILT | Chesed (Mercy) |
| C-4 | CULL | Geburah (Severity) |
| N-5 | LIMN | Tiferet (Beauty) |
| H-6 | TOLL | Netzach (Victory) |
| P-7 | VAULT | Hod (Splendour) |
| D-8 | WICK | Yesod (Foundation) |
| F-9 | ANVIL | Malkuth (Kingdom) |
| R-10 | SCHISM | Daat (Knowledge) |
| Ø | VOID | AinSoph (Limitless) |

### Orisha Resonance

Each archetype carries a primary and shadow Orisha correspondence:

| Designation | Primary | Shadow |
|-------------|---------|--------|
| S-0 | Obatala | Eshu |
| T-1 | Ogun | Obatala |
| V-2 | Orunmila | Elegua |
| L-3 | Yemoja | Ogun |
| C-4 | Ogun | Yemoja |
| N-5 | Oshun | Shango |
| H-6 | Shango | Oshun |
| P-7 | Orunmila | Elegua |
| D-8 | Elegua | Orunmila |
| F-9 | Ogun | Obatala |
| R-10 | Eshu | Obatala |
| Ø | Obatala | Eshu |

### Psychometric Weights

Each archetype has a target profile across psychometric dimensions:

```typescript
psychometricWeights: {
  openness: 0.0-1.0,      // General openness to experience
  intellect: 0.0-1.0,     // Intellectual curiosity
  mellow: 0.0-1.0,        // MUSIC: slow, quiet, romantic
  unpretentious: 0.0-1.0, // MUSIC: percussive, conventional
  sophisticated: 0.0-1.0, // MUSIC: complex, instrumental
  intense: 0.0-1.0,       // MUSIC: distorted, loud
  contemporary: 0.0-1.0   // MUSIC: rhythmic, electronic
}
```

Classification uses weighted distance from these targets.

---

## Security Considerations

### Never Expose to Client

The following must only be imported server-side:

1. `@subtaste/core/src/pantheon/internal.ts`
   - Sephirotic mappings
   - Orisha correspondences
   - Psychometric weight profiles

2. `TasteGenome._engine`
   - Full psychometric profile
   - Sephirotic balance
   - Orisha resonance

### Safe for Client

1. `TasteGenomePublic` — Stripped version without `_engine`
2. `ArchetypePublic` — Public archetype definitions
3. `PANTHEON` — Public definitions only
4. Glyph and Sigil strings

### Sigil Reveal Pattern

```typescript
// Server: Sigil always present in genome
genome.formal.primarySigil = 'Severis';
genome.formal.revealed = false;

// Client request to reveal
POST /api/profile/:userId/sigil

// Server: Mark as revealed, return sigil
genome.formal.revealed = true;
genome.formal.revealedAt = new Date();

// Client: Now can display sigil
const publicGenome = toPublicGenome(genome);
publicGenome.formal.primarySigil // 'Severis' (if revealed)
```

---

## Configuration

### Scoring Configuration

```typescript
interface ScoringConfig {
  temperature: number;           // Softmax sharpness (default: 5)
  secondaryThreshold: number;    // Min confidence for secondary (default: 0.15)
  distributionThreshold: number; // Min weight to include (default: 0.01)
  signalWeights: {
    explicit: number;            // Quiz answers (default: 1.0)
    intentionalImplicit: number; // Saves, shares (default: 0.6)
    unintentionalImplicit: number; // Dwell, skip (default: 0.3)
  };
  psychometricWeight: number;    // Blend ratio (default: 0.7)
  temporalDecay: number;         // Daily decay (default: 0.99)
}
```

### Evolution Configuration

```typescript
interface EvolutionConfig {
  recalibrationThreshold: number; // Days before prompt (default: 30)
  dailyDecay: number;             // Signal decay (default: 0.99)
  minimumSignals: number;         // For reliable classification (default: 3)
  maxHistorySize: number;         // Signal retention limit (default: 1000)
}
```

---

## Integration Patterns

### Refyn Adapter (Planned)

```typescript
// packages/sdk/src/adapters/refyn.ts

export interface RefynTasteContext {
  glyph: Glyph;
  creativeMode: CreativeMode;
  promptModifiers: {
    tone: string;
    complexity: 'accessible' | 'moderate' | 'sophisticated';
    exampleStyle: string;
    pacing: 'direct' | 'exploratory' | 'methodical';
  };
}

export function adaptPromptForUser(
  basePrompt: string,
  context: RefynTasteContext
): string {
  return `${basePrompt}

---
ADAPTATION CONTEXT (apply subtly):
- User archetype: ${context.glyph} (${context.creativeMode})
- Tone: ${context.promptModifiers.tone}
- Complexity: ${context.promptModifiers.complexity}
---`;
}
```

### Direct Integration

```typescript
import { createOrchestrator, behaviourBatchToSignals } from '@subtaste/profiler';
import { toPublicGenome } from '@subtaste/core';

// App initialisation
const orchestrator = createOrchestrator(userId, existingGenome);

// On user action
orchestrator.recordBehaviour([
  { type: 'like', itemId: 'content-123', timestamp: new Date() }
]);

// Periodic update
const genome = orchestrator.processPendingSignals();
const publicGenome = toPublicGenome(genome);

// Use in recommendations
const distribution = genome.archetype.distribution;
// Weight content by archetype affinity
```

---

## Testing Strategy

### Unit Tests

- Classification algorithm determinism
- Signal weight application
- Psychometric similarity calculation
- Softmax behaviour at edge cases

### Integration Tests

- Full profiling flow (3Q → Glyph)
- Calibration confidence gains
- Behavioural signal accumulation
- Genome evolution over time

### Property Tests

- Distribution always sums to 1.0
- Confidence bounded 0-1
- Primary designation always in distribution
- Softmax temperature effects

---

## Future Considerations

### Phase 2: SDK Package

- React hooks (useGenome, useArchetype, useProfiler)
- Generic integration adapters
- Event-driven architecture

### Phase 3: API Service

- Standalone REST API
- B2B licensing layer
- Rate limiting and authentication

### Phase 4: Cross-Modal

- Domain strength tracking
- Taste typicality scoring
- Visual/audio embedding integration

---

## Changelog

### v0.1.0 (2026-01-26)

- Initial implementation of THE TWELVE
- Core classification engine
- Progressive profiling system
- Hidden psychometric/esoteric layers
