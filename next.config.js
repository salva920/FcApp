/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimizaciones de compilación
  experimental: {
    optimizeCss: true,
  },
  
  // Configuración de webpack para mejorar el caché
  webpack: (config, { isServer }) => {
    // Caché de módulos para desarrollo más rápido
    config.cache = {
      type: 'filesystem',
    }
    
    // Optimización de resolución de módulos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    
    // Optimización de chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Common chunk
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true
          }
        }
      }
    }
    
    return config
  },
  
  // Configuración del servidor de desarrollo
  onDemandEntries: {
    // Periodo en ms para mantener las páginas en caché
    maxInactiveAge: 25 * 1000,
    // Número de páginas que deben ser conservadas simultáneamente
    pagesBufferLength: 10,
  },
}

module.exports = nextConfig
