"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

type SyncSource = "form" | "preview" | null;

interface ActiveFieldState {
  activeField: string | null;
  syncSource: SyncSource;
  selectedElementId: string | null;
  setActiveField: (field: string | null, source?: "form" | "preview") => void;
  setSelectedElementId: (id: string | null) => void;
}

const ActiveFieldContext = createContext<ActiveFieldState>({
  activeField: null,
  syncSource: null,
  selectedElementId: null,
  setActiveField: () => {},
  setSelectedElementId: () => {},
});

export function ActiveFieldProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [activeField, setActiveFieldRaw] = useState<string | null>(null);
  const [syncSource, setSyncSource] = useState<SyncSource>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const setActiveField = useCallback(
    (field: string | null, source: "form" | "preview" = "form") => {
      setActiveFieldRaw(field);
      setSyncSource(source);
    },
    []
  );

  const value = useMemo(
    () => ({ activeField, syncSource, selectedElementId, setActiveField, setSelectedElementId }),
    [activeField, syncSource, selectedElementId, setActiveField]
  );

  return (
    <ActiveFieldContext.Provider value={value}>
      {children}
    </ActiveFieldContext.Provider>
  );
}

export function useActiveField(): ActiveFieldState {
  return useContext(ActiveFieldContext);
}
