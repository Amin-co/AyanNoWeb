import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.scss";
import Providers from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/ui/Footer";

const brandName = process.env.APP_BRAND_NAME?.trim() || "AyanNo";

export const metadata: Metadata = {
  title: `${brandName} | Digital Dining`,
  description: `${brandName} helps guests explore the menu, order, and earn rewards with ease.`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>
          <Header brandName={brandName} />
          {children}
          <Footer brandName={brandName} />
        </Providers>
      </body>
    </html>
  );
}
