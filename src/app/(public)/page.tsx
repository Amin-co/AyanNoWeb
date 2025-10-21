import Container from "@/components/ui/Container";
import QRCards from "@/components/landing/QRCards";

const storeStatus = {
  isOpen: true,
  message: "Accepting dine-in and pick-up orders.",
  capacity: "Dining room is at 70% capacity",
  nextChange: "Next break at 15:30",
};

export default function LandingPage() {
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
            <div>
              <div style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.85rem" }}>
                {storeStatus.isOpen ? "Open Now" : "Currently Closed"}
              </div>
              <p className="muted">{storeStatus.message}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="muted">{storeStatus.capacity}</p>
              <p className="muted">{storeStatus.nextChange}</p>
            </div>
          </div>
          <QRCards />
        </section>
      </Container>
    </main>
  );
}
