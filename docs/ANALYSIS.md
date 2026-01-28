# ANALYSIS.md — Phase 1 Repository Audit

**Date:** 2026-01-26
**Analyst:** Claude Code
**Scope:** subtaste + refyn repositories

---

## 1. SUBTASTE CURRENT STATE

### 1.1 Directory Structure

```
/home/sphinxy/subtaste/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── api/                       # REST API endpoints
│   │   │   ├── quiz/                  # Quiz submission & session management
│   │   │   ├── profile/               # User profile fetch/recompute
│   │   │   ├── scp/                   # Superfan Conversion Probability
│   │   │   ├── content/               # Content interaction tracking
│   │   │   └── interactions/          # Engagement logging
│   │   ├── quiz/page.tsx              # Quiz UI
│   │   ├── results/page.tsx           # Results display
│   │   └── feed/page.tsx              # Content feed
│   ├── components/                    # React components
│   │   ├── quiz/                      # ModernQuiz, SubtasteQuiz, RefinementQuiz
│   │   ├── results/                   # Results display
│   │   └── scp/                       # SCP visualisation
│   └── lib/                           # Core business logic
│       ├── archetypes/                # 8 viral archetypes (current system)
│       ├── constellations/            # 27 constellations (legacy)
│       ├── quiz/                      # Scoring & question banks
│       ├── enneagram/                 # Enneagram assessment
│       ├── scp/                       # Superfan Conversion Probability
│       └── types/                     # TypeScript interfaces
├── prisma/schema.prisma               # Database schema
└── package.json
```

### 1.2 Archetype Definitions

**Current System: 8 Viral Archetypes**

| ID | Name | Title | Creative Mode |
|----|------|-------|---------------|
| VESPYR | The Sage | Twilight mysticism | Contemplative |
| IGNYX | The Rebel | Rule-breaking | Disruptive |
| AURYN | The Enlightened | Golden wisdom | Healing |
| PRISMAE | The Artist | Colour & emotion | Expressive |
| SOLARA | The Leader | Radiant power | Commanding |
| CRYPTA | The Hermit | Encrypted knowledge | Occult |
| VERTEX | The Visionary | Future tech | Innovative |
| FLUXUS | The Connector | Fluid bridging | Adaptive |

**Schema per Archetype:**
```typescript
{
  id, displayName, title, emoji, tagline,
  coreMotivation, coreStrength, coreShadow,
  traitProfile: {
    openness: [min, max],
    conscientiousness: [min, max],
    extraversion: [min, max],
    agreeableness: [min, max],
    neuroticism: [min, max],
    noveltySeeking: [min, max],
    aestheticSensitivity: [min, max],
    riskTolerance: [min, max]
  },
  enneagramAffinities: [types],
  visualKeywords[], musicKeywords[], colorPalette[],
  shareableHandle, hashTags, viralHook
}
```

**Legacy System: 27 Constellations**
- Still active with migration flag `migratedToArchetypes`
- Examples: Somnexis, Nycataria, Holovain, Obscyra, Holofern, etc.

### 1.3 Profiling Mechanism

**Hybrid Multi-Layer Assessment:**

| Layer | Type | Questions | Method |
|-------|------|-----------|--------|
| Core Psychometric | Binary + Multiple Choice | 12 | Trait deltas |
| Enneagram | Likert (optional) | 27 | Type scoring |
| Aesthetic | Image selection | Embedded in core | Aesthetic adjustments |
| Behavioural | Implicit | Continuous | Swipe/dwell/save signals |

**Trait Dimensions:**
- Big Five: openness, conscientiousness, extraversion, agreeableness, neuroticism
- Extended: noveltySeeking, aestheticSensitivity, riskTolerance

**Aesthetic Adjustments per Answer:**
- darknessPreference, complexityPreference, organicVsSynthetic
- tempoCenter, energyCenter, acousticVsDigital

### 1.4 Scoring Algorithm

**Three-Stage Pipeline:**

```
Stage 1: Raw Trait Scoring
├─ Normalise responses to 0-1
├─ Apply IRT weighting by discrimination
├─ Add secondary trait loadings
└─ Output: Record<TraitId, { score, confidence, std }>

Stage 2: Archetype Assignment
├─ Compute trait similarity to each archetype range
├─ Apply weights: aesthetic traits = 1.5x
├─ Add Enneagram bonuses (+0.15 primary, +0.08 secondary)
├─ Softmax with temperature=5
└─ Output: { primary, secondary, blendWeights }

Stage 3: Derived Metrics
├─ Subtaste Index: 100 * (1 - normalized_entropy)
├─ Explorer Score: weighted combination of openness + novelty + risk
└─ Early Adopter Score: similar weighted combination
```

### 1.5 Data Model

**Per User:**
- `User` — id, email, displayName
- `PsychometricProfile` — 8 trait scores + confidence + Enneagram data
- `AestheticPreference` — visual/music preferences with ranges
- `ConstellationProfile` — primary/secondary with blend weights, migration status

**Per Assessment:**
- `QuizSession` — selected questions, answers, status, scoring result
- `ProfileHistory` — versioned snapshots with trigger type

**Behavioural:**
- `UserContentInteraction` — immutable event log (view, like, save, skip)
- `ContentScore` — computed alignment scores per user-content pair

**SCP System:**
- `DepthSignal` — engagement events (save, replay, share, etc.)
- `SuperfanScore` — cached SCP for user-creator pairs

### 1.6 API Surface

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/quiz` | Submit quiz results |
| GET | `/api/quiz?sessionId=x` | Get session status |
| GET | `/api/profile?userId=x` | Fetch profile (full/summary/export) |
| POST | `/api/profile` | Recompute profile |
| POST | `/api/interactions` | Log interaction |
| POST | `/api/scp` | Calculate SCP |
| POST | `/api/scp/signals` | Log depth signal |

**Module Exports:**
```typescript
// Scoring
computeArchetypeScores(input) → Record<ArchetypeId, 0-1>
computeArchetypeProfile(input) → ArchetypeProfile
scoreTraits(answers) → ScoringResult

// Configuration
getArchetype(id), getArchetypeIds(), ARCHETYPES
```

### 1.7 Current Limitations

| Area | Limitation | Impact |
|------|------------|--------|
| Archetype System | 8 archetypes hardcoded | Cannot extend without code changes |
| Question Bank | 12 fixed questions | No adaptive selection |
| Scoring Parameters | Temperature=5, weights hardcoded | No tuning without deploy |
| Enneagram | Underutilised | Data collected but barely used |
| Content Scoring | Schema only | No actual computation |
| ML Embeddings | Infrastructure only | Not computed |
| Behavioural Learning | Log only | No feedback loop |
| Real-time Refinement | UI exists, API empty | Cannot incrementally update |
| Configuration | No .env for weights | Every change requires code |
| Multi-context | Not supported | Single monolithic profile |

---

## 2. REFYN CURRENT STATE

### 2.1 Project Overview

**Refyn** is a Chrome extension providing AI prompt optimisation across 15+ generation platforms (Midjourney, DALL-E, Leonardo, Suno, Udio, Runway, etc.).

**Core Function:** Learn user taste through feedback loops and inject learned preferences into Claude API calls for prompt enhancement.

### 2.2 Current Personalisation

**Multi-Layered Architecture:**

| Layer | Data | Learning Method |
|-------|------|-----------------|
| Deep Learning | Keyword scores per category | Feedback weights (+1.5 to +3.5 like, -3 delete) |
| Preferences | Simple keyword counts | Like/dislike tallies |
| Taste Profile | Visual/audio patterns | Successful prompt analysis |
| Taste Library | 6 modular dimensions | Stacked keyword associations |
| Signature Style | Prompt length, parameter usage | Pattern detection |

**Taste Library Layers:**
- Mood: Brooding, Serene, Electric, Tender, Fierce
- Palette: Ember, Frost, Neon, Earth, Mono
- Light: Chiaroscuro, Diffused, Harsh, Golden
- Era: Victorian, Y2K, Retro, Futuristic
- Lens: Cultural/artistic perspectives
- Form: Technical style definitions

### 2.3 User Data Model

```typescript
// Deep Preferences
refyn_deep_preferences: {
  keywordScores: { [category]: { [keyword]: score } },  // -10 to +10
  platformScores: { [platform]: { [keyword]: score } },
  successfulCombinations: string[][],
  failedCombinations: string[][],
  trashReasons: { [reason]: count },
  likeReasons: { [reason]: count },
  crossPlatformKeywords: { [keyword]: { platforms[], totalScore } },
  promptPatterns: [{ pattern, score, platforms[] }],
  signatureStyle: { preferredLength, usesParameters, moods[], qualifiers[] }
}

// Taste Profile
refyn_taste_profile: {
  visual: { colorPalette[], lighting[], composition[], style[] },
  audio: { genres[], moods[], tempo[], production[], vocalStyle[] },
  patterns: { frequentKeywords{}, preferredParameters{}, successfulPrompts[] }
}
```

### 2.4 Integration Points

| Component | Taste Signal Source | Consumption Point |
|-----------|-------------------|-------------------|
| FloatingPanel | Like/Trash buttons with reasons | recordFeedback() |
| Prompt Optimizer | None (consumes) | buildOptimizationPrompt() |
| Claude API | None (consumes) | System prompt injection |
| Output Observer | Detects generations | Associates with prompts |
| Suggestion Engine | None (consumes) | getSuggestedKeywords() |

### 2.5 Prompt Optimisation Flow

```
User Prompt
    ↓
Platform Detection
    ↓
Load: getDeepPreferences() + getTasteProfile()
    ↓
getSmartSuggestionContext() generates:
    ├─ STRONGLY PREFER: cinematic, warm tones, golden hour
    ├─ AVOID: harsh, grayscale, abstract
    ├─ Successful combinations: [cinematic + warm]
    ├─ Reason insights: values "great-style" 47x
    ├─ Signature: medium length, uses parameters
    └─ Patterns: "highly detailed" effective
    ↓
buildOptimizationPrompt() combines all context
    ↓
Claude API (Haiku 3.5)
    ↓
Optimised Prompt → User Feedback → Loop
```

### 2.6 Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind, Zustand
- **Build:** Vite
- **Storage:** Chrome local storage, optional Supabase sync
- **AI:** Claude API (claude-3-5-haiku)
- **Architecture:** Chrome Extension Manifest v3

---

## 3. GAP ANALYSIS

### Target State: THE TWELVE System

The target architecture introduces:
- **12 Archetypes** (vs current 8) with three-register naming (Designation, Glyph, Sigil)
- **Hidden psychometric layer** (Big Five Openness sub-facets + MUSIC model)
- **Hidden esoteric layer** (Sephirotic + Orisha mappings — engine only)
- **Multi-context profiles** (Spotify-style contextual vectors)
- **Progressive profiling** (3-question onboarding → gradual depth)
- **Cross-modal taste typicality** scoring
- **Bayesian updating** for preference drift
- **Cross-app portability** via SDK

### Gap Matrix

| Capability | subtaste Current | refyn Current | Target State | Gap Severity |
|------------|-----------------|---------------|--------------|--------------|
| **Archetype Count** | 8 (VESPYR, etc.) | None | 12 (THE TWELVE) | MEDIUM — rebuild required |
| **Three-Register Naming** | displayName + title | None | Designation + Glyph + Sigil | HIGH — new concept |
| **Glyph Reveal UX** | Immediate full reveal | N/A | Progressive reveal | MEDIUM — UX change |
| **Sigil Reveal** | Not supported | N/A | User-requested reveal | HIGH — new feature |
| **Psychometric Foundation** | Big Five + 3 custom | Keyword scoring | Big Five Openness facets + MUSIC | MEDIUM — extend existing |
| **Hidden Engine Layer** | None | None | Sephirotic + Orisha weights | HIGH — entirely new |
| **Multi-context Profiles** | None | Platform-specific scores | Context vectors (Creating, Consuming, Curating) | HIGH — architectural |
| **Progressive Profiling** | 12 fixed questions | Continuous implicit | 3Q onboard → gradual | MEDIUM — reduce + add stages |
| **Cross-modal Transfer** | Schema exists, unused | Cross-platform keywords | Taste typicality scoring | MEDIUM — implement existing schema |
| **Bayesian Updating** | None | Feedback weights | Thompson Sampling | HIGH — new algorithm |
| **Preference Drift** | ProfileHistory exists | Last 100 entries | Temporal weighting + history value | LOW — extend existing |
| **Cross-app Portability** | API exists | Chrome-only | SDK with adapters | MEDIUM — refactor to SDK |
| **Refyn Integration** | None | Standalone | Shared taste genome | HIGH — new integration |
| **B2B API** | Internal only | None | Licensed external access | LOW — wrapper layer |

### Architecture Gap Summary

```
CURRENT STATE                           TARGET STATE
─────────────────────────────────────────────────────────────
subtaste (monolith)                    @subtaste/core
├─ 8 archetypes                        ├─ 12 archetypes (PANTHEON)
├─ Big Five + 3 traits                 ├─ Big Five Openness facets
├─ Fixed 12Q quiz                      ├─ MUSIC model (hidden)
├─ Single profile                      ├─ Sephirotic/Orisha (hidden)
└─ REST API                            └─ TasteGenome schema

refyn (Chrome extension)               @subtaste/profiler
├─ Keyword scoring                     ├─ Progressive stages
├─ Platform-specific                   ├─ Calibration instruments
├─ Taste library (6 layers)            └─ Implicit signal processing
└─ Deep preferences
                                       @subtaste/sdk
                                       ├─ Client
                                       ├─ React hooks
                                       └─ Adapters (refyn, etc.)
```

### Critical Decisions Required

1. **Migration Strategy:** Do we preserve the 8-archetype system or break backward compatibility?
2. **Mapping Question:** Can existing VESPYR/IGNYX/etc. map to THE TWELVE, or is this a clean rebuild?
3. **Data Migration:** How do we migrate existing user profiles?
4. **Refyn Integration:** Does Refyn consume subtaste SDK, or does subtaste consume Refyn signals?
5. **Psychometric Depth:** Do we expose Big Five facets to users, or keep them engine-only?

---

## 4. RECOMMENDATIONS FOR PHASE 2

Based on this analysis, the decision should weigh:

**Option A (Enhancement Layer):**
- Pro: Fastest path, preserves existing user data
- Con: 8 → 12 mapping is awkward (not 1:1)
- Risk: Architectural debt accumulates

**Option B (Parallel Systems):**
- Pro: Clean new architecture, backward compatible
- Con: Maintains two systems indefinitely
- Risk: Complexity explosion

**Option C (Full Reconstruction):**
- Pro: Clean implementation of THE TWELVE
- Con: Breaks all existing profiles
- Risk: Higher ship time

**Preliminary Assessment:**
Given that subtaste is still early (no public API consumers documented), and the gap between 8 archetypes and THE TWELVE is significant enough that mapping would feel forced, **Option C (Full Reconstruction)** appears most aligned with the strategic vision — provided we can ship MVP within the stated timeframe.

The hidden psychometric/esoteric layer is the key differentiator. Bolting it onto the existing system would create inconsistency. A clean rebuild allows the PANTHEON to be the single source of truth from day one.

---

**Next Step:** Proceed to DECISION.md to formalise architectural choice.
