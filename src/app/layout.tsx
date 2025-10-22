import type { ReactNode } from "react";
import { defaultLocale } from "@/i18n/locales";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
