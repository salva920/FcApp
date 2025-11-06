'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { ReactNode } from 'react'
import theme from '../theme'
import '../globals.css'

export default function LoginLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <ChakraProvider theme={theme}>
          {children}
        </ChakraProvider>
      </body>
    </html>
  )
}
