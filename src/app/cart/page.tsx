import Container from "@/components/ui/Container";

export default function CartPage() {
  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <h1>Cart</h1>
        <p className="muted">Items you add will appear here for a quick review before checkout.</p>
      </Container>
    </main>
  );
}
