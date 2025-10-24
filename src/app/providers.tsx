"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CacheProvider } from "@emotion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { createMuiTheme } from "@/theme/muiTheme";
import { CartProvider } from "@/features/cart/store";
import rtlCache from "@/lib/rtlCache";

type ProvidersProps = {
  children: ReactNode;
  dir: "rtl" | "ltr";
};

export default function Providers({ children, dir }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const theme = useMemo(() => createMuiTheme(dir), [dir]);

  const content = (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </CartProvider>
      </QueryClientProvider>
    </AppRouterCacheProvider>
  );

  return (
    dir === "rtl" ? <CacheProvider value={rtlCache}>{content}</CacheProvider> : content
  );
}
