/**
 * @subtaste/profiler/instruments - Assessment Instrument Exports
 */

// Initial assessment
export {
  createInitialAssessment,
  getCurrentQuestion,
  submitResponse,
  isComplete,
  getProgress,
  completeAssessment,
  estimateTimeRemaining
} from './initial';

export type {
  InitialAssessmentState,
  InitialAssessmentResult
} from './initial';

// Calibration instruments
export {
  createMusicCalibration,
  createDeepCalibration,
  getCurrentCalibrationQuestion,
  submitCalibrationResponse,
  isCalibrationComplete,
  getCalibrationProgress,
  completeCalibration,
  qualifiesForMusicCalibration,
  qualifiesForDeepCalibration,
  getEstimatedTime
} from './calibration';

export type {
  CalibrationType,
  CalibrationState,
  CalibrationResult
} from './calibration';

// Implicit signals
export {
  behaviourToSignal,
  behaviourBatchToSignals,
  calculateBehaviouralStrength
} from './implicit';

export type {
  BehaviouralEvent,
  ItemMetadata
} from './implicit';
