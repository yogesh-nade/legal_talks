import { createMuiTheme } from '@material-ui/core/styles';

const customTheme = (darkMode) =>
  createMuiTheme({
    palette: {
      type: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#D4AF37' : '#8B4513', // Gold and Saddle Brown for legal authority
      },
      secondary: {
        main: darkMode ? '#B8860B' : '#2F4F4F', // Dark Golden Rod and Dark Slate Gray
      },
      background: {
        default: darkMode ? '#121212' : '#fafafa', // Normal dark background
        paper: darkMode ? '#1e1e1e' : '#fff',
      },
    },
    overrides: {
      MuiTypography: {
        root: {
          wordBreak: 'break-word',
        },
      },
    },
  });

export default customTheme;
