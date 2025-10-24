"use client";

import { AppBar, Toolbar, Typography, IconButton, Box, Stack } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useTranslations } from "next-intl";

type AdminAppBarProps = {
  locale: string;
};

const AdminAppBar = ({ locale }: AdminAppBarProps) => {
  const t = useTranslations("admin");

  return (
    <AppBar
      elevation={0}
      position="sticky"
      sx={{
        backgroundColor: "background.paper",
        color: "text.primary",
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: 72,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            color="inherit"
            edge="start"
            sx={{ display: { md: "none" } }}
            aria-label="Open admin navigation"
          >
            <MenuIcon />
          </IconButton>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {`Active locale: ${locale.toUpperCase()}`}
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {t.has?.("home.title") ? t("home.title") : "Ayanno Admin"}
            </Typography>
          </Box>
        </Stack>
        <IconButton color="inherit" edge="end" aria-label="Admin account">
          <AccountCircleIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default AdminAppBar;
