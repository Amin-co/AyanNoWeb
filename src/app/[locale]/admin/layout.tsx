import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import AdminNav from "@/components/admin/AdminNav";
import AdminAppBar from "@/components/admin/AdminAppBar";
import AdminGuard from "@/components/admin/AdminGuard";
import { locales, defaultLocale, type Locale } from "@/i18n/locales";

type LayoutParams = {
  locale?: string;
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params?: Promise<LayoutParams>;
}) {
  const resolvedParams = (await params) ?? {};
  const locale = (resolvedParams.locale as Locale | undefined) ?? defaultLocale;

  if (!locales.includes(locale)) {
    notFound();
  }

  return (
    <AdminGuard locale={locale}>
      <Box
        component="section"
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <AdminNav locale={locale} />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <AdminAppBar locale={locale} />
          <Box
            component="main"
            sx={{
              flex: 1,
              width: "100%",
              maxWidth: "1320px",
              mx: "auto",
              px: { xs: 2, md: 4 },
              py: { xs: 2, md: 3 },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </AdminGuard>
  );
}
