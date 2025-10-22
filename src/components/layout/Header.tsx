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
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";

const navItems = [
  { href: "/menu", label: "منو" },
  { href: "/cart", label: "سبد" },
  { href: "/checkout", label: "تسویه" },
  { href: "/account", label: "حساب کاربری" },
];

const gold = "#D4AF37";

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);

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
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </Box>
  );

  return (
    <>
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
              اعیان‌نو
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

          {isMobile ? (
            <>
              <IconButton
                edge="end"
                onClick={toggleDrawer}
                sx={{ color: gold }}
                aria-label="منو"
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
                    اعیان‌نو
                  </Typography>
                  <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {navItems.map((item) => (
                      <ListItem key={item.href} disablePadding>
                        <ListItemButton
                          component={Link}
                          href={item.href}
                          onClick={toggleDrawer}
                          sx={{
                            borderRadius: 2,
                            "&:hover": { backgroundColor: "rgba(212,175,55,0.12)" },
                          }}
                        >
                          <ListItemText primary={item.label} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            navLinks
          )}
        </Toolbar>
      </AppBar>
    </>
  );
}
