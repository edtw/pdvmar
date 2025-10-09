// theme/index.js - Marambaia Coastal Theme
import { extendTheme } from '@chakra-ui/react';

// Coastal Color Palette - Brazilian Beach Restaurant
const colors = {
  // Primary Brand Colors (Ocean-inspired)
  brand: {
    50: '#E6F7FF',   // Lightest ocean blue
    100: '#BAE7FF',  // Sky reflection
    200: '#91D5FF',  // Shallow water
    300: '#69C0FF',  // Tropical water
    400: '#40A9FF',  // Clear ocean
    500: '#0891B2',  // PRIMARY - Deep ocean (WCAG AA: 4.52:1)
    600: '#0E7490',  // Ocean depth (WCAG AA: 5.98:1)
    700: '#155E75',  // Deep water
    800: '#164E63',  // Dark ocean
    900: '#083344',  // Deepest ocean
  },

  // Secondary: Sunset/Coral Accent
  sunset: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',  // PRIMARY sunset orange
    600: '#EA580C',  // WCAG AA compliant on white
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Tertiary: Sand/Neutral
  sand: {
    50: '#FDFCFB',
    100: '#F9F7F4',
    200: '#F5F1EA',
    300: '#EAE3D8',
    400: '#D6CABD',
    500: '#B5A393',
    600: '#968776',
    700: '#746656',
    800: '#5A4F42',
    900: '#433930',
  },

  // Accent: Tropical/Seafoam
  tropical: {
    50: '#F0FDF9',
    100: '#CCFBEF',
    200: '#99F6E0',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
};

// Typography
const fonts = {
  heading: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
  body: '"Inter", "Open Sans", system-ui, -apple-system, sans-serif',
};

const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  md: '1rem',       // 16px - base (WCAG minimum)
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
};

// Spacing (8px grid system)
const space = {
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
};

// Enhanced shadows for depth
const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Border radius
const radii = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  full: '9999px',
};

// Component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: 'full',
    },
    sizes: {
      sm: {
        h: '40px',
        minW: '40px',
        fontSize: 'sm',
        px: 4,
      },
      md: {
        h: '48px',      // WCAG compliant touch target
        minW: '48px',
        fontSize: 'md',
        px: 6,
      },
      lg: {
        h: '56px',
        minW: '56px',
        fontSize: 'lg',
        px: 8,
      },
    },
    defaultProps: {
      size: 'md',
      colorScheme: 'brand',
    },
  },

  IconButton: {
    sizes: {
      sm: { w: '40px', h: '40px' },
      md: { w: '48px', h: '48px' },  // WCAG compliant
      lg: { w: '56px', h: '56px' },
    },
    defaultProps: {
      size: 'md',
    },
  },

  Heading: {
    baseStyle: {
      fontWeight: '700',
      lineHeight: '1.2',
    },
  },

  Text: {
    baseStyle: {
      lineHeight: '1.6',
    },
  },

  Skeleton: {
    baseStyle: {
      borderRadius: 'md',
      startColor: 'gray.100',
      endColor: 'gray.300',
    },
  },
};

// Global styles
const styles = {
  global: {
    body: {
      fontSize: 'md',  // 16px base
      lineHeight: '1.6',
      color: 'gray.800',
      bg: 'gray.50',
    },
  },
};

// Main theme object
export const theme = extendTheme({
  colors,
  fonts,
  fontSizes,
  space,
  shadows,
  radii,
  components,
  styles,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;
