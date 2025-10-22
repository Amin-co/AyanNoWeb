import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const theme = createTheme({
  direction: "rtl",
  palette: {
    mode: "dark",
    primary: {
      main: "#D4AF37",
    },
    background: {
      default: "#0E0E0E",
      paper: "#141414",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      '"Vazirmatn", system-ui, -apple-system, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
  },
});

export default responsiveFontSizes(theme);
