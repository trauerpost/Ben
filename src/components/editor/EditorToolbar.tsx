"use client";

interface EditorToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onAddText: () => void;
}

export default function EditorToolbar({
  onUndo,
  onRedo,
  onAddText,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-brand-border">
      <button
        onClick={onUndo}
        className="p-2 rounded hover:bg-brand-light-gray transition-colors text-brand-gray hover:text-brand-dark"
        title="Undo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 014 4v2M3 10l4-4m-4 4l4 4" />
        </svg>
      </button>
      <button
        onClick={onRedo}
        className="p-2 rounded hover:bg-brand-light-gray transition-colors text-brand-gray hover:text-brand-dark"
        title="Redo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a4 4 0 00-4 4v2m14-6l-4-4m4 4l-4 4" />
        </svg>
      </button>

      <div className="w-px h-6 bg-brand-border mx-1" />

      <button
        onClick={onAddText}
        className="px-3 py-1.5 rounded text-sm bg-brand-light-gray hover:bg-brand-border transition-colors text-brand-dark"
      >
        + Text
      </button>
    </div>
  );
}
