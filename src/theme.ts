import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#737373", // neutral-500
      light: "#a3a3a3", // neutral-400
      dark: "#525252", // neutral-600
    },
    secondary: {
      main: "#404040", // neutral-700
      light: "#737373", // neutral-500
      dark: "#262626", // neutral-800
    },
    background: {
      default: "#171717", // neutral-900
      paper: "#262626", // neutral-800
    },
    surface: {
      main: "#404040", // neutral-700
    },
    text: {
      primary: "#fafafa", // neutral-50
      secondary: "#d4d4d4", // neutral-300
    },
    error: {
      main: "#ef4444", // red-500
    },
    warning: {
      main: "#f59e0b", // amber-500
    },
    success: {
      main: "#10b981", // emerald-500
    },
    info: {
      main: "#3b82f6", // blue-500
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#171717", // neutral-900
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#262626", // neutral-800
          borderBottom: "1px solid #404040", // neutral-700
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#262626", // neutral-800 - visible but still dark
          border: "1px solid #404040", // neutral-700 border for visibility
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.875rem",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
        containedPrimary: {
          backgroundColor: "#737373", // neutral-500 - lighter than default
          color: "#fafafa", // neutral-50 - bright text
          "&:hover": {
            backgroundColor: "#525252", // neutral-600 - darker on hover
          },
        },
        outlinedPrimary: {
          borderColor: "#737373", // neutral-500
          color: "#a3a3a3", // neutral-400 - lighter text
          "&:hover": {
            borderColor: "#a3a3a3", // neutral-400
            backgroundColor: "rgba(115, 115, 115, 0.1)", // neutral-500 with opacity
            color: "#fafafa", // neutral-50 - bright on hover
          },
        },
        outlinedWarning: {
          borderColor: "#f59e0b", // amber-500
          color: "#f59e0b", // amber-500
          "&:hover": {
            borderColor: "#fbbf24", // amber-400
            backgroundColor: "rgba(245, 158, 11, 0.1)", // amber-500 with opacity
            color: "#fbbf24", // amber-400
          },
        },
        text: {
          color: "#a3a3a3", // neutral-400 - lighter text
          "&:hover": {
            backgroundColor: "rgba(115, 115, 115, 0.1)", // neutral-500 with opacity
            color: "#fafafa", // neutral-50 - bright on hover
          },
        },
      },
    },
  },
});

declare module "@mui/material/styles" {
  interface Palette {
    surface: Palette["primary"];
  }

  interface PaletteOptions {
    surface?: PaletteOptions["primary"];
  }
}
