import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "@/i18n/locales";
import "@/app/globals.scss";
import Providers from "../providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/ui/Footer";

const brandName = process.env.APP_BRAND_NAME?.trim() || "AyanNo";

export const metadata: Metadata = {
  title: `${brandName} | Digital Dining`,
  description: `${brandName} helps guests explore the menu, order, and earn rewards with ease.`,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LayoutParams = {
  locale?: string;
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params?: Promise<LayoutParams>;
}) {
  const resolvedParams = (await params) ?? {};
  const localeFromParams = resolvedParams.locale;
  const locale = (localeFromParams as Locale | undefined) ?? defaultLocale;

  if (!locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers dir={dir}>
            <Header brandName={brandName} />
            {children}
            <Footer brandName={brandName} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
