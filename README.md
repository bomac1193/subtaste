# subtaste

Unified taste profiling infrastructure for the VIOLET SPHINX ecosystem.

## The Twelve

Every user carries a Glyph—a classification within the subtaste pantheon:

**KETH** · **STRATA** · **OMEN** · **SILT** · **CULL** · **LIMN** · **TOLL** · **VAULT** · **WICK** · **ANVIL** · **SCHISM** · **VOID**

The Glyph is your creative signature. It describes how you find, filter, and champion what matters.

For those who seek further: each Glyph carries a formal classification—its Sigil. Request it when you are ready.

---

## Strategic Vision

### Diagnosis: The Taste Crisis

The creative tools market faces a fundamental problem: personalisation without depth. Current systems optimise for engagement metrics, not creative alignment. They know what you clicked, not why you create.

As AI generates infinite content, the bottleneck shifts from production to curation. Labels spend $8.1B annually on A&R with 10-20% success rates. 45 million songs have never been played once. The question is no longer "what can we make?" but "what deserves to exist?"

Taste is becoming the scarcest resource.

### Guiding Policy: Layered Architecture

We reject the false choice between scientific validity and archetypal depth. Our approach:

1. **Psychometric foundation**: Validated instruments inform the engine
2. **Archetypal resonance**: Cultural depth that statistics cannot capture
3. **Behavioural learning**: Signals that evolve the profile over time

The architecture is deliberately opaque. Users receive their Glyph. The machinery stays hidden.

### Strategic Roadmap

**Year 1-5**: Establish subtaste as the standard taste profiling library for creative tools
- Ship SDK, gain adoption across VIOLET SPHINX ecosystem
- Prove predictive validity
- Build B2B API for external developers

**Year 5-10**: Become infrastructure
- Taste profiles portable across platforms
- License to labels for A&R intelligence
- Cross-modal taste transfer

**Year 10-20**: Own the taste graph
- Network effects compound
- Taste credentials become verifiable
- Settlement layer integration

**Year 20-40**: Taste as currency
- Human curation compensated as the scarce resource it is
- AI creates, humans curate—and curators earn

### Revenue Model

| Horizon | Primary Revenue | Secondary Revenue |
|---------|-----------------|-------------------|
| 1-5 years | SDK licensing | Freemium consumer profiling |
| 5-10 years | B2B API (labels, platforms) | Taste intelligence reports |
| 10-20 years | Protocol fees | Cross-platform licensing |
| 20-40 years | Settlement layer fees | Credential marketplace |

---

## Installation

```bash
pnpm add @subtaste/core @subtaste/profiler
```

## Usage

```typescript
import {
  classifySignals,
  toGlyph,
  getArchetype,
  generateIdentityStatement
} from '@subtaste/core';

import {
  createOrchestrator,
  createInitialAssessment,
  submitResponse
} from '@subtaste/profiler';

// Create orchestrator for a user
const orchestrator = createOrchestrator(userId);

// Start initial assessment
const assessment = orchestrator.startInitialAssessment();

// Submit responses
let state = assessment;
state = submitResponse(state, 0); // First question: option A
state = submitResponse(state, 1); // Second question: option B
state = submitResponse(state, 0); // Third question: option A

// Complete and get genome
const genome = orchestrator.completeActiveAssessment();

// Get the user's Glyph
const glyph = genome.archetype.primary.glyph; // e.g., 'CULL'

// Get identity statement
const statement = generateIdentityStatement(
  genome.archetype.primary.designation,
  genome.archetype.secondary?.designation || null
);
// "You are CULL, The Essential Editor. The CULL removes..."
```

### Recording Behavioural Signals

```typescript
import { behaviourBatchToSignals } from '@subtaste/profiler';

// Record user behaviour
orchestrator.recordBehaviour([
  { type: 'save', itemId: 'track-123', timestamp: new Date() },
  { type: 'skip', itemId: 'track-456', timestamp: new Date() },
  { type: 'share', itemId: 'track-789', timestamp: new Date() }
]);

// Process signals and update genome
const updatedGenome = orchestrator.processPendingSignals();
```

### Sigil Reveal

```typescript
import { revealSigil, getPrimarySigil } from '@subtaste/core';

// User requests formal classification
const revealedGenome = revealSigil(genome);
const sigil = getPrimarySigil(revealedGenome); // e.g., 'Severis'
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    APPLICATIONS                      │
│         Refyn · SELECTR · DROPR · CANORA            │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                @subtaste/profiler                    │
│        Instruments · Questions · Progressive        │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  @subtaste/core                      │
│     Pantheon · Engine · Genome · Context            │
├─────────────────────────────────────────────────────┤
│                    [HIDDEN]                          │
│        Psychometrics · Sephirotic · Orisha          │
└─────────────────────────────────────────────────────┘
```

### Package Structure

```
packages/
├── core/                      # Shared taste genome logic
│   ├── types/                 # TasteGenome, Archetype, Signal types
│   ├── pantheon/              # THE TWELVE definitions
│   │   ├── definitions.ts     # Public archetypes
│   │   └── internal.ts        # Engine weights (NEVER EXPORT)
│   ├── engine/                # Classification algorithm
│   ├── genome/                # TasteGenome operations
│   └── context/               # Multi-context profiles
│
└── profiler/                  # Assessment instruments
    ├── instruments/           # Initial, Calibration, Implicit
    ├── questions/             # Question bank and mappings
    └── progressive/           # Stage orchestration
```

---

## The Pantheon

| Glyph | Essence | Creative Mode |
|-------|---------|---------------|
| KETH | The unmarked throne. First without announcement. | Visionary |
| STRATA | The hidden architecture. Layers beneath surfaces. | Architectural |
| OMEN | What arrives before itself. The shape of the unformed. | Prophetic |
| SILT | Patient sediment. What accumulates in darkness. | Developmental |
| CULL | The necessary cut. What must be removed, removed. | Editorial |
| LIMN | To illuminate by edge. The binding outline. | Integrative |
| TOLL | The bell that cannot be unheard. The summons. | Advocacy |
| VAULT | What is kept. Writing over writing. | Archival |
| WICK | Draws flame upward without burning. The hollow channel. | Channelling |
| ANVIL | Where pressure becomes form. The manifestation point. | Manifestation |
| SCHISM | The productive fracture. What breaks to reveal grain. | Contrarian |
| VOID | The deliberate absence. What receives by containing nothing. | Receptive |

---

## Progressive Profiling

Subtaste uses progressive profiling to build taste genomes without friction:

### Stage 1: Initial Spark (Onboarding)
- 3 binary questions
- ~30 seconds
- Sufficient for primary Glyph assignment

### Stage 2: Music Calibration (Milestone)
- 3 Likert questions
- Triggered after 5 interactions
- Refines MUSIC dimensions

### Stage 3: Deep Calibration (On-Demand)
- 5 mixed questions
- ~2 minutes
- Unlocks confidence boost

---

## Key Concepts

### Three Registers

Each archetype carries three layers of identity:

1. **Glyph** - The spoken name (public, what users claim)
2. **Sigil** - Formal notation (revealed on request)
3. **Designation** - Alphanumeric code (power users only)

### Hidden Layers

The classification engine is powered by hidden layers never exposed to users:

- **Psychometric weights** - Big Five Openness facets + MUSIC model
- **Sephirotic balance** - Structural relationships from Kabbalistic Tree
- **Orisha resonance** - Energetic signatures and shadow patterns

These inform the algorithm but remain invisible. Users experience archetypes, not statistics.

### Multi-Context Profiles

Inspired by Spotify's contextual vectors, users can have different taste expressions:

- **Creating** - When making things
- **Consuming** - When experiencing content
- **Curating** - When selecting and organising

---

## API Reference

### Core Exports

```typescript
// Classification
classify(input: ClassificationInput): ClassificationResult
classifySignals(signals: Signal[]): ArchetypeClassification

// Pantheon
PANTHEON: Record<Designation, ArchetypeDefinition>
getArchetype(designation: Designation): ArchetypeDefinition
toGlyph(designation: Designation): Glyph
toSigil(designation: Designation): Sigil

// Genome
encodeSignalsToGenome(userId: string, signals: Signal[]): TasteGenome
updateGenomeWithSignals(genome: TasteGenome, signals: Signal[]): TasteGenome
toPublicGenome(genome: TasteGenome): TasteGenomePublic
revealSigil(genome: TasteGenome): TasteGenome

// Context
getContextualDistribution(genome: TasteGenome, context: string): Record<Designation, number>
detectContext(signals: Signal[]): ContextDetection
```

### Profiler Exports

```typescript
// Assessment
createInitialAssessment(): InitialAssessmentState
submitResponse(state: InitialAssessmentState, response: 0 | 1): InitialAssessmentState
completeAssessment(state: InitialAssessmentState): InitialAssessmentResult

// Calibration
createMusicCalibration(): CalibrationState
createDeepCalibration(): CalibrationState

// Orchestration
createOrchestrator(userId: string, existingGenome?: TasteGenome): ProfilingOrchestrator

// Signals
behaviourToSignal(event: BehaviouralEvent): Signal
responsesToSignals(responses: QuestionResponse[]): Signal[]
```

---

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm -r typecheck

# Run Next.js dev server
pnpm dev
```

---

## Licence

Proprietary. VIOLET SPHINX ecosystem only.

---

*subtaste: Because your aesthetic identity deserves better than an engagement algorithm.*
