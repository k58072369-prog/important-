import { useEffect, useRef, useCallback } from "react";
import { saveDraft, loadDraft, clearDraft, hasDraft } from "./backup";

/**
 * Auto-saves form state to localStorage on every change.
 * Restores the draft automatically when the form opens.
 * Clears the draft when the form is successfully submitted.
 *
 * Usage:
 *   const { formRef, clearFormDraft, hasDraft } = useFormDraft("add_student", form, setForm);
 */
export function useFormDraft<T>(
  key: string,
  value: T,
  setValue: (v: T) => void,
  options: { enabled?: boolean; maxAgeMs?: number } = {}
) {
  const { enabled = true, maxAgeMs = 24 * 60 * 60 * 1000 } = options;
  const isFirstRender = useRef(true);
  const savedKey = `form_${key}`;

  // On mount — restore draft
  useEffect(() => {
    if (!enabled) return;
    const draft = loadDraft<T>(savedKey, maxAgeMs);
    if (draft !== null) {
      setValue(draft);
    }
  }, [key]); // eslint-disable-line

  // On every change — save draft (skip first render to avoid overwriting with initial value)
  useEffect(() => {
    if (!enabled) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveDraft(savedKey, value);
  }, [value, enabled, savedKey]);

  const clearFormDraft = useCallback(() => {
    clearDraft(savedKey);
  }, [savedKey]);

  const formHasDraft = hasDraft(savedKey);

  return { clearFormDraft, hasDraft: formHasDraft };
}
