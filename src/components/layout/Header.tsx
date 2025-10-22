"use client";

import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import { Link as IntlLink } from "@/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type NavItem = {
  href: string;
  label: string;
};

const gold = "#D4AF37";

type HeaderProps = {
  brandName: string;
};

export default function Header({ brandName }: HeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const tNav = useTranslations("nav");
  const navItems: NavItem[] = [
    { href: "/menu", label: tNav("menu") },
    { href: "/cart", label: tNav("cart") },
    { href: "/checkout", label: tNav("checkout") },
    { href: "/account", label: tNav("account") },
  ];

  const toggleDrawer = () => setOpen((prev) => !prev);

  const navLinks = (
    <Box
      component="nav"
      sx={{
        display: "flex",
        alignItems: "center",
        columnGap: 3,
        "& a": {
          color: "rgba(255,255,255,0.8)",
          textDecoration: "none",
          fontWeight: 500,
          transition: "color 0.2s ease",
          "&:hover": { color: gold },
        },
      }}
    >
      {navItems.map((item) => (
        <IntlLink key={item.href} href={item.href}>
          {item.label}
        </IntlLink>
      ))}
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: "blur(18px)",
        backgroundColor: "rgba(18, 18, 18, 0.9)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Toolbar
        sx={{
          maxWidth: "1200px",
          width: "100%",
          mx: "auto",
          px: 2,
          minHeight: 72,
          display: "flex",
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}
          >
            {brandName}
          </Typography>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: "rgba(255,255,255,0.08)" }}
          />
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "999px",
              backgroundColor: gold,
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {isMobile ? (
            <>
              <IconButton
                edge="end"
                onClick={toggleDrawer}
                sx={{ color: gold }}
                aria-label="Open navigation"
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={open}
                onClose={toggleDrawer}
                PaperProps={{
                  sx: {
                    width: 240,
                    backgroundColor: "#111",
                    color: "#fff",
                  },
                }}
              >
                <Box sx={{ py: 3, px: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {brandName}
                  </Typography>
                  <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {navItems.map((item) => (
                      <ListItem key={item.href} disablePadding>
                        <Box
                          component={IntlLink}
                          href={item.href}
                          onClick={toggleDrawer}
                          sx={{
                            width: "100%",
                            display: "block",
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            color: "inherit",
                            textDecoration: "none",
                            "&:hover": {
                              backgroundColor: "rgba(212,175,55,0.12)",
                            },
                          }}
                        >
                          <ListItemText primary={item.label} />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            navLinks
          )}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
            }}
          >
            <LanguageSwitcher />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
