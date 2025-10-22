import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";

export default async function CartPage() {
  const t = await getTranslations("cart");

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <h1>{t("title")}</h1>
        <p className="muted">{t("emptyMessage")}</p>
      </Container>
    </main>
  );
}
