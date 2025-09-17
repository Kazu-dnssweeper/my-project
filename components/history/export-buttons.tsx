"use client";

import type { DomainAnalysisResult } from "@/lib/types/dns";

export const ExportButtons = ({ result }: { result: DomainAnalysisResult }) => {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dnsweeper-${result.domain}-${result.scanDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = [
      "name",
      "type",
      "content",
      "reason",
      "confidence",
      "recommendation",
    ];

    const rows = result.results.map((entry) => [
      entry.record.name,
      entry.record.type,
      entry.record.content,
      entry.reason,
      entry.confidence.toString(),
      entry.recommendation,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dnsweeper-${result.domain}-${result.scanDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2 text-xs">
      <button
        type="button"
        onClick={exportJson}
        className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-indigo-400 hover:text-white"
      >
        JSON
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-indigo-400 hover:text-white"
      >
        CSV
      </button>
    </div>
  );
};
