import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import Container from "@/components/ui/Container";
import QRCards from "@/components/landing/QRCards";
import { type Locale, defaultLocale } from "@/i18n/locales";

const serviceState = {
  isOpen: true,
  capacityPercent: 70,
  nextBreak: "15:30",
};

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = (locale as Locale | undefined) ?? defaultLocale;
  const t = await getTranslations({ locale: currentLocale, namespace: "landing" });
  const dir = currentLocale === "fa" ? "rtl" : "ltr";
  const textAlignEnd = dir === "rtl" ? "left" : "right";
  const actionDirection = dir === "rtl" ? "row-reverse" : "row";
  const statusLabel = t(serviceState.isOpen ? "status.open" : "status.closed");

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <section style={{ display: "grid", gap: "2rem" }}>
          <div
            className="card"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              rowGap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.85rem" }}>
                {statusLabel}
              </span>
              <span className="muted">
                {t("status.capacity", { value: serviceState.capacityPercent })}
              </span>
            </div>
            <div style={{ textAlign: textAlignEnd }}>
              <span className="muted">
                {t("status.nextBreak", { time: serviceState.nextBreak })}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1.5rem",
            }}
          >
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0 }}>
                {t("hero.title")}
              </h1>
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                {t("hero.subtitle")}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                flexDirection: actionDirection,
              }}
            >
              <Link
                href="/menu"
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "999px",
                  backgroundColor: "rgba(212,175,55,0.15)",
                  color: "inherit",
                  border: "1px solid rgba(212,175,55,0.4)",
                }}
              >
                {t("cta.orderNow")}
              </Link>
              <Link
                href="/service-area"
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "inherit",
                }}
              >
                {t("cta.serviceArea")}
              </Link>
            </div>
          </div>

          <QRCards />
        </section>
      </Container>
    </main>
  );
}
