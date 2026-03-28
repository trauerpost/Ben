"use client";

import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

interface ActiveFieldState {
  activeField: string | null;
  setActiveField: (field: string | null) => void;
}

const ActiveFieldContext = createContext<ActiveFieldState>({
  activeField: null,
  setActiveField: () => {},
});

export function ActiveFieldProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [activeField, setActiveField] = useState<string | null>(null);
  const value = useMemo(() => ({ activeField, setActiveField }), [activeField]);
  return (
    <ActiveFieldContext.Provider value={value}>
      {children}
    </ActiveFieldContext.Provider>
  );
}

export function useActiveField(): ActiveFieldState {
  return useContext(ActiveFieldContext);
}
