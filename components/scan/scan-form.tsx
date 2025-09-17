"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import type { DomainAnalysisResult } from "@/lib/types/dns";

const formSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^(?:[a-zA-Z0-9][-a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
      "Enter a valid domain name"
    ),
});

type FormValues = z.infer<typeof formSchema>;

export const ScanForm = ({
  savedDomains,
}: {
  savedDomains: { id: string; domain_name: string }[];
}) => {
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DomainAnalysisResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { domain: savedDomains.at(0)?.domain_name ?? "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/dns/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error ?? "Failed to run scan");
      }
      return (await response.json()) as DomainAnalysisResult;
    },
    onSuccess: (analysis) => {
      setResult(analysis);
      setProgress(100);
    },
  });

  useEffect(() => {
    if (mutation.isPending) {
      setProgress(5);
      const interval = setInterval(() => {
        setProgress((current) => {
          if (current >= 90) return current;
          return current + 5;
        });
      }, 600);
      return () => clearInterval(interval);
    }
    return () => undefined;
  }, [mutation.isPending]);

  const summaryRows = useMemo(() => {
    if (!result) return [];
    return [
      {
        label: "Total records",
        value: result.summary.totalRecords,
      },
      {
        label: "Garbage detected",
        value: result.summary.garbageCount,
      },
      {
        label: "Safe to delete",
        value: result.summary.safeToDeleteCount,
      },
      {
        label: "Needs review",
        value: result.summary.reviewNeededCount,
      },
      {
        label: "Estimated savings",
        value: `$${result.estimatedMonthlySavings.toFixed(2)}/mo`,
      },
    ];
  }, [result]);

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="domain" className="text-sm font-medium text-slate-200">
            Domain to scan
          </label>
          <input
            id="domain"
            type="text"
            placeholder="example.com"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            {...register("domain")}
          />
          {errors.domain && (
            <p className="text-sm text-rose-400">{errors.domain.message}</p>
          )}
        </div>

        {savedDomains.length > 0 && (
          <div className="text-sm text-slate-400">
            <span className="mr-2">Previously scanned:</span>
            {savedDomains.map((domain) => (
              <button
                key={domain.id}
                type="button"
                className="mr-2 rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-indigo-400 hover:text-white"
                onClick={() => setValue("domain", domain.domain_name)}
              >
                {domain.domain_name}
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
        >
          {mutation.isPending ? "Scanning..." : "Run scan"}
        </button>

        {mutation.isPending && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Analyzing DNS records...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {mutation.isError && (
          <p className="text-sm text-rose-400">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Failed to run scan"}
          </p>
        )}
      </form>

      {result && (
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-white">
              Results for {result.domain}
            </h3>
            <p className="text-sm text-slate-400">
              Scanned on {new Date(result.scanDate).toLocaleString()}
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            {summaryRows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {row.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-white">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Record</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {result.results.length ? (
                  result.results.map((record) => (
                    <tr key={record.record.id} className="hover:bg-slate-900/70">
                      <td className="px-4 py-3 text-slate-200">
                        <div className="font-semibold text-white">
                          {record.record.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {record.record.type} · {record.record.content}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{record.reason}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {(record.confidence * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {record.recommendation === "safe_to_delete"
                          ? "Safe to delete"
                          : record.recommendation === "review_needed"
                          ? "Review"
                          : "Keep"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400" colSpan={4}>
                      No garbage detected in this scan. 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
