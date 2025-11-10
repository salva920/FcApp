'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import theme from './theme'
import './globals.css'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'

const NAVBAR_HIDDEN_ROUTES = ['/login']

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))
  const pathname = usePathname()
  const shouldShowNavbar = !NAVBAR_HIDDEN_ROUTES.some(route => pathname === route || pathname?.startsWith(`${route}/`))

  return (
    <html lang="es">
      <body>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider theme={theme}>
            {shouldShowNavbar && <Navbar />}
            <Suspense fallback={<LoadingSpinner message="Cargando página..." />}>
              {children}
            </Suspense>
          </ChakraProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
