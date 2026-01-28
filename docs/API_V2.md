# Subtaste API v2 - THE TWELVE System

This document describes the v2 API endpoints for THE TWELVE taste genome system.

## Base URL

All v2 endpoints are prefixed with `/api/v2/`.

---

## Genome Endpoints

### GET `/api/v2/genome/[userId]`

Get the full taste genome for a user. **Server-side only** - includes hidden engine layers.

**Parameters:**
- `userId` (path): User ID
- `migrate` (query, optional): Set to `true` to migrate legacy profile to THE TWELVE

**Response:**
```json
{
  "id": "genome_...",
  "userId": "...",
  "version": 1,
  "archetype": {
    "primary": {
      "designation": "V-2",
      "glyph": "OMEN",
      "confidence": 0.78
    },
    "secondary": {
      "designation": "D-8",
      "glyph": "LIMN",
      "confidence": 0.45
    },
    "distribution": { ... }
  },
  "formal": {
    "primarySigil": "Presagis",
    "secondarySigil": "Lunarix",
    "revealed": false
  },
  "_engine": { ... },
  "behaviour": { ... }
}
```

### GET `/api/v2/genome/[userId]/public`

Get the public-safe taste genome. Safe for client-side use.

**Response:**
```json
{
  "id": "genome_...",
  "userId": "...",
  "version": 1,
  "archetype": {
    "primary": {
      "designation": "V-2",
      "glyph": "OMEN",
      "confidence": 0.78
    },
    "secondary": null
  },
  "formal": {
    "primarySigil": null,
    "secondarySigil": null,
    "revealed": false
  },
  "confidence": 0.78,
  "tasteTypicality": 0.65
}
```

### POST `/api/v2/genome/[userId]/sigil`

Reveal the user's sigil (esoteric name). Progressive reveal for engaged users.

**Response:**
```json
{
  "success": true,
  "sigil": "Presagis",
  "genome": { ... }
}
```

---

## Quiz Endpoints

### POST `/api/v2/quiz`

Submit quiz responses and generate initial taste genome.

**Request Body:**
```json
{
  "userId": "optional-user-id",
  "sessionId": "optional-session-id",
  "responses": [
    { "questionId": "init-1-approach", "response": 0 },
    { "questionId": "init-2-timing", "response": 1 },
    { "questionId": "init-3-creation", "response": 0 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "userId": "created-or-existing-user-id",
  "genome": { ... },
  "glyph": "STRATA",
  "designation": "T-1",
  "confidence": 0.72
}
```

### GET `/api/v2/quiz?userId=xxx`

Get profiling progress for a user.

**Response:**
```json
{
  "hasStarted": true,
  "currentStage": "calibration",
  "stagesCompleted": ["initial"],
  "signalCount": 5
}
```

---

## Signals Endpoints

### POST `/api/v2/signals/[userId]`

Submit behavioural signals for genome refinement.

**Request Body:**
```json
{
  "signals": [
    {
      "type": "explicit",
      "itemId": "track-123",
      "kind": "rating",
      "value": 5,
      "archetypeWeights": { "S-0": 0.3, "D-8": 0.2 }
    },
    {
      "type": "intentional_implicit",
      "itemId": "track-456",
      "kind": "save"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "signalsProcessed": 2,
  "genome": { ... }
}
```

### GET `/api/v2/signals/[userId]`

Get signal stats for a user.

**Response:**
```json
{
  "userId": "...",
  "hasGenome": true,
  "version": 3,
  "confidence": 0.85
}
```

---

## Refyn Integration Endpoints

### GET `/api/v2/refyn/[userId]`

Get Refyn taste context for prompt adaptation.

**Response:**
```json
{
  "context": {
    "glyph": "OMEN",
    "creativeMode": "Prophetic",
    "confidence": 0.78,
    "promptModifiers": {
      "tone": "intuitive and forward-looking",
      "complexity": "moderate",
      "exampleStyle": "use historical and referential examples",
      "pacing": "exploratory",
      "aestheticKeywords": ["emergent", "prescient", "forward", "nascent"],
      "avoidKeywords": ["dated", "nostalgic", "retrospective"]
    },
    "identityStatement": "You operate in Prophetic mode..."
  },
  "systemPrompt": "The user has been identified as OMEN...",
  "glyph": "OMEN",
  "creativeMode": "Prophetic"
}
```

### POST `/api/v2/refyn/[userId]/affinity`

Assess content affinity for a user.

**Request Body:**
```json
{
  "contentAttributes": {
    "complexity": "sophisticated",
    "isExperimental": true,
    "isMinimal": false
  }
}
```

**Response:**
```json
{
  "userId": "...",
  "glyph": "OMEN",
  "affinity": {
    "score": 0.72,
    "reasoning": "complexity match, experimental affinity"
  }
}
```

---

## THE TWELVE Designations

| Designation | Glyph | Sigil | Creative Mode |
|-------------|-------|-------|---------------|
| S-0 | KETH | Aethonis | Editorial |
| T-1 | STRATA | Tectris | Architectural |
| V-2 | OMEN | Presagis | Prophetic |
| L-3 | SILT | Alluvion | Developmental |
| C-4 | CULL | Selectrix | Editorial |
| N-5 | NEXIS | Omnivia | Integrative |
| H-6 | TOLL | Resonar | Manifestation |
| P-7 | VAULT | Archivum | Archival |
| D-8 | LIMN | Lunarix | Channelling |
| F-9 | FORMA | Praxeon | Manifestation |
| R-10 | SCHISM | Ruptura | Visionary |
| Ø | VOID | Vacuon | Receptive |
