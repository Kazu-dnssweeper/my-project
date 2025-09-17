"use client";

import { ReactNode, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryClientConfig,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
};

export const QueryProvider = ({
  children,
  config = defaultQueryClientConfig,
}: {
  children: ReactNode;
  config?: QueryClientConfig;
}) => {
  const [client] = useState(() => new QueryClient(config));

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
