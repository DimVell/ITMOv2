import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#246b48', dark: '#174b32', contrastText: '#ffffff' },
    background: { default: '#f4f6f5', paper: '#ffffff' },
    text: { primary: '#17261f', secondary: '#63716a' },
    success: { main: '#246b48' },
    error: { main: '#b52f38' },
    divider: '#e4eae6',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 15,
    h1: { fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 700, letterSpacing: '-0.055em', lineHeight: 1.12 },
    h2: { fontSize: '1.25rem', fontWeight: 650, letterSpacing: '-0.025em' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' },
    body1: { fontSize: '1rem', lineHeight: 1.65 },
    body2: { fontSize: '0.9rem', lineHeight: 1.6 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 46, borderRadius: 10, paddingInline: 20 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #e4eae6', boxShadow: '0 4px 18px #17261f03' } },
    },
    MuiTextField: { defaultProps: { fullWidth: true, variant: 'outlined' } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10, fontSize: '0.9rem' } } },
    MuiChip: { styleOverrides: { root: { fontSize: '0.8rem', fontWeight: 500 } } },
  },
});
