//WHAT IS A DOMAIN TYPE ? 
// It lives in its own folder (domain/) because it has zero dependencies
//It doesn't import from storage, UI, or analytics. EVERYTHING ELSE IMPORTS FROM HERE.
// Nothing here imports from elsewhere.
// WHY THESE SPECIFIC FIELDS ? - 
//? id:string (unique identifier. We use timestamp-based string IDs)
//? timestamp: number - Unix time in milliseconds. Why not a Data object ?
//? Numbers are simpler to store, sort, and  do math on.
//? version: schema version, Currently 1 .  When we add new fields later (energy, tags, notes)
//! Old entries will have version: 1 and we migrate them.Without this field, adding fields silently breaks old data.

export type CheckIn = {
    id: string;
    timestamp: number;
    mood: number;
    focus: number;
    version: number;
};

// --------- CONSTANTS -------
// All magic numbers live here -- never scatter(dağıtmak) them across files .
// If the scale changes from 1-5 to 1-10, you change it in ONE place.

export const CHECKIN_CONSTANTS = {

    MOOD_MIN: 1,
    MOOD_MAX: 5,
    FOCUS_MIN: 1,
    FOCUS_MAX: 5,
    CURRENT_VERSION: 1,

} as const;

//------LABELS--------------
// Human-readable labels for each score value.
// Used in UI components 

export const MOOD_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Fair',
  3: 'Neutral',
  4: 'Good',
  5: 'High',
};

 
export const FOCUS_LABELS: Record<number, string> = {
  1: 'Scattered',
  2: 'Drifting',
  3: 'Present',
  4: 'Sharp',
  5: 'Locked In',
};

//-------------- FACTORY FUNCTION --------

// A factory function creates a new CheckIn with correct defaults.
// Why a function instead of writing the object manually each time ?
// 1.Consistency - every checkIn is created the same way
// 2.Safety- version is always set correctly
// 3.Single place to change - if we add a field , add it here once 
// ----------------------------------------

export function createCheckIn(params:
{
    mood: number;
    focus: number;
}): CheckIn {
  return {

    id: Date.now().toString(),
    timestamp: Date.now(),
    mood: params.mood,
    focus: params.focus,
    version: CHECKIN_CONSTANTS.CURRENT_VERSION,

    };
}
