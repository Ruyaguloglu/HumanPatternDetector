/* 
   *UI Layer ( React Component )

    - UI sadece event yakalar , veri gönderir. Logic içermez .

    const handleSave = () => {
      addCheckIn({ mood: 8, focus: 6 });
  };

   * Custom Hook ( işin kalbi )

    -const { addCheckIn } = useCheckIns();

   * Domain Logic ( factory )

    -const checkIn = createCheckIn(params); id oluşturulur, timestamp eklenir

    *Storage Layer 

    - await checkInStorage.save(checkIn); AsyncStorage burada kullanılır

   *State Update 
    - setCheckIns(prev => [...prev, checkIn]); UI güncellenir.

  User → Form → Hook → createCheckIn → AsyncStorage → State → UI

    UI (Button Click)  nerede -> component
      ↓
    Custom Hook (useCheckIns)
      ↓
    Domain Logic - Factory (createCheckIn) 
      ↓
    Storage (AsyncStorage)
      ↓
    State Update
      ↓
    UI Re-render




  ---------WHAT IS A CUSTOM HOOK ?----------------

  React Logic'ini tekrar kullanılabilir bir fonksiyon haline getirmek .
  Logic tekrarını önler , component sade kalır , test edilebilirlik artar.
  Eğer şunu diyrosan "Bu logic başka yerde de kullanacağım"

 INPUT -> TRANSFORM -> STORE -> OUTPUT 


   A custom hook is a function that:
    1. Starts with "use" (React's naming convention)
    2. Uses React's built-in hooks (useState,useEffect, etc.)
    3. Returns data and functions that components

  * Think of it as the BRIDGE between your data and your UI layer.

  *   Storage Layer <--> useCheckins hook <--> Screen components

  Without this hook every screen would need to : Manage its own loading state, Call AsyncStorage directly, handle errors individually, duplicate the same logic 4 times

  ! With this hook , every screen just writes : 
  ! const { checkins, addCheckin, isLoading } = useCheckins();

  HOOKS EXPLAINED 

  * useState (initialValue)
  Creates a piece of state. Returns 
  [currentValue , setterFunction].

  when setter is called , component rerenders with new value.

  * useEffect (function, [dependencies])
    Runs AFTER the component renders.
    Runs again whenever values in the dependency array change.
    Empty array [] means: run once when component first mounts.
    We use it to load data when the hook is first used.




 */

import { CheckIn, createCheckIn } from "@/domain/CheckIn";
import {
  addCheckin as addCheckinToStorage,
  clearAllCheckins,
  deleteCheckin as deleteCheckinFromStorage,
  loadCheckins,
} from "@/storage/checkinStorage";
import { useCallback, useEffect, useState } from "react";

// HOOK RETURN TYPE -----------------
// Explicitly typing what the hook returns makes it self-documenting.
// Any component using this hook sees exactly what's available.

type UseCheckinsReturn = {
  checkins: CheckIn[]; // all stored check-ins
  isLoading: boolean; // true while loading from storage
  isSaving: boolean; // true while saving to storage
  addCheckin: (mood: number, focus: number) => Promise<boolean>;
  deleteCheckin: (id: string) => Promise<boolean>;
  clearAll: () => Promise<boolean>;
  hasCheckedInToday: boolean; // true if there's already an entry today
  todaysCheckin: CheckIn | undefined; // today's entry if it exists
};

// ------------The Hook----------------

export function useCheckins(): UseCheckinsReturn {
  //----State----
  // Three pieces of state this hook man ages:
  // * checkins -> the actual data array
  // * isLoading -> are we currently reading from storage ?
  // * isSaving -> are we currently writing to storage ?

  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // --- LOAD ON MOUNT ---

  // useEffect with [] runs exactly once — when a component
  // first uses this hook. We load all stored check-ins from storage.
  //
  // The pattern:
  //   setIsLoading(true)   → tell UI "data is coming"
  //   await loadCheckins() → actually fetch from storage
  //   setCheckins(data)    → put data into state (triggers re-render)
  //   setIsLoading(false)  → tell UI "data is ready"

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await loadCheckins();
      setCheckins(data);
      setIsLoading(false);
    }
    load();
  }, []);

  // ----- DERİVED VALUES ----------
  // These are computed FROM state, not stored IN state.
  // ! never store something in state that can be calculated

  const today = new Date().toDateString();
  const todaysCheckin = checkins.find(
    (c) => new Date(c.timestamp).toDateString() === today,
  );

  const hasCheckedInToday = todaysCheckin !== undefined;

  /* 
  * PROCESS :
  1- Create a new CheckIn object using our factory function
  2- Save it to storage
  3- If successful, update local state immediately 
*/

  const addCheckin = useCallback(
    async (mood: number, focus: number): Promise<boolean> => {
      setIsSaving(true);
      const newEntry = createCheckIn({ mood, focus });
      const success = await addCheckinToStorage(newEntry);
      if (success) {
        // Optimistic update: add to local state immediately.
        // The phone storage and UI state are now in sync.
        setCheckins((prev) => [...prev, newEntry]);
      }
      setIsSaving(false);
      return success;
    },
    [],
  );

  // ---DELETE CHECK-IN ---------------------

  const deleteCheckin = useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true);
    const success = await deleteCheckinFromStorage(id);
    if (success) {
      setCheckins((prev) => prev.filter((c) => c.id !== id));
    }
    setIsSaving(false);
    return success;
  }, []);

  const clearAll = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    const success = await clearAllCheckins();
    if (success) {
      setCheckins([]);
    }
    setIsSaving(false);
    return success;
  }, []);

  return {
    checkins,
    isLoading,
    isSaving,
    addCheckin,
    deleteCheckin,
    clearAll,
    hasCheckedInToday,
    todaysCheckin,
  };
}
