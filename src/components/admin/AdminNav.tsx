"use client";

import { useMemo, useState } from "react";
import { usePathname, Link } from "@/navigation";
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useTranslations } from "next-intl";

type AdminNavProps = {
  locale: string;
};

type NavItem = {
  href: string;
  labelKey: string;
};

const primaryLinks: NavItem[] = [
  { href: "/admin", labelKey: "nav.dashboard" },
  { href: "/admin/orders", labelKey: "nav.orders" },
  { href: "/admin/service-area", labelKey: "nav.serviceArea" },
  { href: "/admin/settings", labelKey: "nav.settings" },
];

const catalogLinks: NavItem[] = [
  { href: "/admin/catalog/categories", labelKey: "nav.categories" },
  { href: "/admin/catalog/items", labelKey: "nav.items" },
  { href: "/admin/catalog/addons", labelKey: "nav.addons" },
];

const AdminNav = ({ locale }: AdminNavProps) => {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const activeMap = useMemo(() => {
    const map = new Map<string, boolean>();
    [...primaryLinks, ...catalogLinks].forEach((item) => {
      map.set(item.href, pathname.startsWith(`/${locale}${item.href}`));
    });
    return map;
  }, [locale, pathname]);

  const catalogActive = useMemo(
    () => catalogLinks.some((item) => pathname.startsWith(`/${locale}${item.href}`)),
    [locale, pathname],
  );

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 0, md: 240 },
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          {t("home.title")}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1 }}>
        {primaryLinks.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={activeMap.get(item.href)}
          >
            <ListItemText primary={t(item.labelKey)} />
          </ListItemButton>
        ))}

        <ListItemButton
          onClick={() => setCatalogOpen((prev) => !prev)}
          selected={catalogActive}
        >
          <ListItemText primary={t("nav.catalog")} />
          {catalogOpen || catalogActive ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={catalogOpen || catalogActive} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {catalogLinks.map((item) => (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={activeMap.get(item.href)}
                sx={{ pl: 4 }}
              >
                <ListItemText primary={t(item.labelKey)} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </List>
    </Box>
  );
};

export default AdminNav;
