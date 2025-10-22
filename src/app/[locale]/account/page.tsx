import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";

export default async function AccountPage() {
  const t = await getTranslations("account");

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <h1>{t("title")}</h1>
        <p className="muted">{t("description")}</p>
      </Container>
    </main>
  );
}
