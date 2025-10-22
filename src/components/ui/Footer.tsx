import { getTranslations } from "next-intl/server";
import Container from "./Container";

type FooterProps = {
  brandName: string;
};

export default async function Footer({ brandName }: FooterProps) {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "3rem" }}>
      <Container>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.5rem 0",
            gap: "1rem",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          <span>{t("legal", { year, brand: brandName })}</span>
          <span>{t("tagline")}</span>
        </div>
      </Container>
    </footer>
  );
}
