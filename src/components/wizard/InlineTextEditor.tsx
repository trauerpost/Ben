"use client";

import { useRef, useEffect, useCallback } from "react";

interface InlineTextEditorProps {
  value: string;
  style: React.CSSProperties;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

/**
 * contentEditable wrapper for inline text editing on the card preview.
 * Strips HTML on paste, sanitizes on blur, reverts on Escape.
 */
export default function InlineTextEditor({
  value,
  style,
  onCommit,
  onCancel,
}: InlineTextEditorProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const originalValue = useRef(value);

  // On mount: select all text and focus
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerText = value;
    el.focus();
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Strip all HTML, get plain text only
    const plainText = el.innerText.trim();
    if (plainText.length === 0) {
      // Empty → revert to original
      onCommit(originalValue.current);
    } else {
      onCommit(plainText);
    }
  }, [onCommit]);

  function handlePaste(e: React.ClipboardEvent): void {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
  }

  function handleBlur(): void {
    commit();
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        ...style,
        outline: "none",
        cursor: "text",
        minHeight: "1em",
      }}
      spellCheck
    />
  );
}
