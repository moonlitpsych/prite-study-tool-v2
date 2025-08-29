import { useState, useEffect } from 'react';

interface ProcessedQuestion {
  number: number;
  text: string;
  options: { label: string; text: string }[];
  category?: string;
  topics?: string[];
  correctAnswer?: string;
  confidence?: number;
  saved?: boolean;
  isPublic?: boolean;
  examYear?: number;
  examPart?: number;
  draftId?: string; // Unique ID for drafts
}

const DRAFTS_STORAGE_KEY = 'prite-question-drafts';

export const useDrafts = () => {
  const [drafts, setDrafts] = useState<ProcessedQuestion[]>([]);

  // Load drafts from localStorage on mount
  useEffect(() => {
    try {
      const storedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (storedDrafts) {
        const parsed = JSON.parse(storedDrafts);
        setDrafts(parsed);
      }
    } catch (error) {
      console.error('Failed to load drafts from localStorage:', error);
    }
  }, []);

  // Save drafts to localStorage whenever drafts change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save drafts to localStorage:', error);
    }
  }, [drafts]);

  const saveDraft = (question: ProcessedQuestion) => {
    const draftId = question.draftId || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const draftQuestion = {
      ...question,
      draftId,
      saved: false,
    };

    setDrafts(prev => {
      const existingIndex = prev.findIndex(d => d.draftId === draftId);
      if (existingIndex >= 0) {
        // Update existing draft
        const updated = [...prev];
        updated[existingIndex] = draftQuestion;
        return updated;
      } else {
        // Add new draft
        return [...prev, draftQuestion];
      }
    });

    return draftId;
  };

  const removeDraft = (draftId: string) => {
    setDrafts(prev => prev.filter(d => d.draftId !== draftId));
  };

  const clearAllDrafts = () => {
    setDrafts([]);
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
  };

  const updateDraft = (draftId: string, updates: Partial<ProcessedQuestion>) => {
    setDrafts(prev => prev.map(draft => 
      draft.draftId === draftId 
        ? { ...draft, ...updates }
        : draft
    ));
  };

  return {
    drafts,
    saveDraft,
    removeDraft,
    clearAllDrafts,
    updateDraft,
  };
};