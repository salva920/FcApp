import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#fff5f5',
      100: '#ffe3e3',
      200: '#ffbdbd',
      300: '#ff9494',
      400: '#ff6b6b',
      500: '#f44747',
      600: '#e03131',
      700: '#c92a2a',
      800: '#9b1f1f',
      900: '#641313',
    },
  },
  fonts: {
    heading: "'Poppins', 'Inter', sans-serif",
    body: "'Inter', 'Poppins', sans-serif",
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        fontWeight: '600',
        letterSpacing: '0.02em',
      },
    },
  },
})

export default theme

