"use client";

import { useQuery } from "@tanstack/react-query";
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
    staleTime: 1000 * 60,
  });

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <h1>Menu</h1>
        <p className="muted" style={{ marginBottom: "2rem" }}>
          Browse the latest dishes and their current pricing.
        </p>

        {isLoading ? <p className="muted">Loading menu…</p> : null}
        {isError ? (
          <p className="muted">We’re unable to load the menu right now. Please try again.</p>
        ) : null}

        {!isLoading && data && data.length > 0 ? (
          <div className="grid-5">
            {data.map((item) => (
              <div key={item.id} className="card">
                <h3>{item.name}</h3>
                <p className="muted">
                  {item.description ?? "This item will soon include a tasty description."}
                </p>
                <p style={{ marginTop: "0.75rem", fontWeight: 600 }}>
                  {item.price ? `₪${item.price.toFixed(2)}` : "Pricing on request"}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Container>
    </main>
  );
}
