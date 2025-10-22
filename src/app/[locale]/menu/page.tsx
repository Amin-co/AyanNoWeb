"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Container from "@/components/ui/Container";
import api from "@/lib/api";

type MenuItem = {
  id: string;
  name: string;
  price?: number;
  description?: string;
};

type MenuResponse =
  | { items: MenuItem[] }
  | { data: { items: MenuItem[] } }
  | MenuItem[];

const fetchMenu = async (): Promise<MenuItem[]> => {
  const { data } = await api.get<MenuResponse>("/public/menu");

  if (Array.isArray(data)) {
    return data;
  }

  if ("items" in data) {
    return data.items;
  }

  if ("data" in data && Array.isArray(data.data.items)) {
    return data.data.items;
  }

  return [];
};

export default function MenuPage() {
  const locale = useLocale();
  const t = useTranslations("menu");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
    staleTime: 1000 * 60,
  });

  const numberFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, [locale]);

  const formatPrice = (price?: number) => {
    if (typeof price !== "number") {
      return t("priceUnavailable");
    }
    const formatted = numberFormatter.format(price);
    return t("price", { value: formatted });
  };

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <h1>{t("title")}</h1>
        <p className="muted" style={{ marginBottom: "2rem" }}>
          {t("description")}
        </p>

        {isLoading ? <p className="muted">{t("loading")}</p> : null}
        {isError ? <p className="muted">{t("error")}</p> : null}

        {!isLoading && !isError && data && data.length > 0 ? (
          <div className="grid-5">
            {data.map((item) => (
              <div key={item.id} className="card">
                <h3>{item.name}</h3>
                <p className="muted">
                  {item.description ?? t("descriptionFallback")}
                </p>
                <p style={{ marginTop: "0.75rem", fontWeight: 600 }}>
                  {formatPrice(item.price)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Container>
    </main>
  );
}
