import type { CSSProperties } from "react";
import Link from "next/link";
import Container from "./Container";

type HeaderProps = {
  brandName: string;
};

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/account", label: "Account" },
];

const wrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1.25rem 0",
  gap: "1.5rem",
};

const navStyle: CSSProperties = {
  display: "flex",
  gap: "1rem",
  fontSize: "0.95rem",
};

const linkStyle: CSSProperties = {
  color: "rgba(255,255,255,0.8)",
};

export default function Header({ brandName }: HeaderProps) {
  return (
    <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <Container>
        <div style={wrapperStyle}>
          <Link href="/" style={{ fontWeight: 600, fontSize: "1.1rem", color: "#fff" }}>
            {brandName}
          </Link>
          <nav style={navStyle} aria-label="Main navigation">
            {links.map((item) => (
              <Link key={item.href} href={item.href} style={linkStyle}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  );
}
