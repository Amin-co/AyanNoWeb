import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = (resolvedParams?.locale as Locale | undefined) ?? defaultLocale;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <html lang={locale}>
      <body dir={dir}>
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
