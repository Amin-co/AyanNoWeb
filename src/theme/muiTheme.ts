import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const primaryColor = process.env.APP_PRIMARY?.trim() || "#D4AF37";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: primaryColor,
    },
  },
  typography: {
    fontFamily: `'Vazirmatn', 'IRANSansX', 'Segoe UI', 'Tahoma', sans-serif`,
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          paddingInline: "1.5rem",
          textTransform: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 18px 30px rgba(0, 0, 0, 0.35)",
        },
      },
    },
  },
});

export default responsiveFontSizes(theme);
