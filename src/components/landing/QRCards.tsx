"use client";

import { Link } from "@/navigation";
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
import { useLocale, useTranslations } from "next-intl";
import styles from "./QRCards.module.scss";

type CardItem = {
  title: string;
  description: string;
  href: string;
  Icon: typeof RestaurantMenuIcon;
  status?: string;
};

export default function QRCards() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const isRTL = locale === "fa";
  const cards: CardItem[] = [
    {
      title: t("cards.menu.title"),
      description: t("cards.menu.desc"),
      href: "/menu",
      Icon: RestaurantMenuIcon,
      status: t("badge.new"),
    },
    {
      title: t("cards.location.title"),
      description: t("cards.location.desc"),
      href: "/service-area",
      Icon: MyLocationIcon,
    },
    {
      title: t("cards.service.title"),
      description: t("cards.service.desc"),
      href: "/service-area",
      Icon: MapIcon,
    },
    {
      title: t("cards.login.title"),
      description: t("cards.login.desc"),
      href: "/account",
      Icon: LoginIcon,
    },
    {
      title: t("cards.loyalty.title"),
      description: t("cards.loyalty.desc"),
      href: "/account",
      Icon: LoyaltyIcon,
      status: t("badge.comingSoon"),
    },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main">
          {t("hero.overline")}
        </Typography>
        <Typography variant="h4" component="h2" mt={1} mb={1.5}>
          {t("hero.title")}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("hero.description")}
        </Typography>
      </Box>
      <div className={styles.container}>
        {cards.map(({ title, description, href, Icon, status }) => (
          <Card key={title} className={styles.card}>
            <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  }}
                >
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
