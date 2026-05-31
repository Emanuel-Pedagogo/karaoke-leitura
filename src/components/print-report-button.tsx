"use client";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover"
    >
      Exportar PDF (imprimir)
    </button>
  );
}
