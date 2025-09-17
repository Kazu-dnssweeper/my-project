"use client";

import { ReactNode } from "react";

import { QueryProvider } from "@/providers/query-client-provider";

export const Providers = ({ children }: { children: ReactNode }) => (
  <QueryProvider>{children}</QueryProvider>
);
