"use client";

import Link from "next/link";
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import MapIcon from "@mui/icons-material/Map";
import LoginIcon from "@mui/icons-material/Login";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import styles from "./QRCards.module.scss";

type CardItem = {
  title: string;
  description: string;
  href: string;
  Icon: typeof RestaurantMenuIcon;
  status?: string;
};

const cards: CardItem[] = [
  {
    title: "Digital Menu",
    description: "Browse live updates from the kitchen and discover daily specials.",
    href: "/menu",
    Icon: RestaurantMenuIcon,
    status: "New",
  },
  {
    title: "My Table",
    description: "Let the staff know where you are seated for quicker service.",
    href: "/account",
    Icon: MyLocationIcon,
  },
  {
    title: "Fast Checkout",
    description: "Skip the line and complete your payment from the table.",
    href: "/checkout",
    Icon: LoginIcon,
  },
  {
    title: "Review Cart",
    description: "Double-check your order items before you submit.",
    href: "/cart",
    Icon: MapIcon,
  },
  {
    title: "Loyalty Club",
    description: "Collect points on every order and unlock seasonal rewards.",
    href: "/account",
    Icon: LoyaltyIcon,
    status: "Coming Soon",
  },
];

export default function QRCards() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main">
          QR hospitality
        </Typography>
        <Typography variant="h4" component="h2" mt={1} mb={1.5}>
          Everything guests need at the table
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pick a path below to jump straight into ordering, locating your table, or checking what&apos;s new in the kitchen.
        </Typography>
      </Box>
      <div className={styles.container}>
        {cards.map(({ title, description, href, Icon, status }) => (
          <Card key={title} className={styles.card}>
            <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                  <Icon color="primary" />
                  <Typography variant="h6">{title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
                {status ? (
                  <Chip
                    label={status}
                    size="small"
                    color="primary"
                    sx={{ alignSelf: "flex-start" }}
                  />
                ) : null}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </div>
    </Stack>
  );
}
