"use client";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  previewHTML: string;
  onDownloadPDF: () => void;
  isGeneratingPDF?: boolean;
}

export default function PreviewModal({
  open,
  onClose,
  previewHTML,
  onDownloadPDF,
  isGeneratingPDF = false,
}: PreviewModalProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Gestaltung
          </button>

          <h2 className="text-sm font-medium text-brand-dark">Vorschau</h2>

          <button
            onClick={onDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-dark text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isGeneratingPDF ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Wird erstellt...
              </span>
            ) : (
              "PDF herunterladen"
            )}
          </button>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-auto p-8 bg-brand-light-gray flex items-start justify-center">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <iframe
              srcDoc={previewHTML}
              title="Kartenvorschau"
              className="border-0"
              style={{
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
