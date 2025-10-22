"use client";

import { useState, type ReactNode } from "react";
import { CacheProvider } from "@emotion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import muiTheme from "@/theme/muiTheme";
import rtlCache from "@/lib/rtlCache";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <CacheProvider value={rtlCache}>
      <AppRouterCacheProvider options={{ key: "mui" }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </AppRouterCacheProvider>
    </CacheProvider>
  );
}
