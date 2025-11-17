'use client'

import {
  Box,
  Flex,
  Button,
  HStack,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  MenuGroup
} from '@chakra-ui/react'
import {
  FiHome, 
  FiLogOut, 
  FiUser, 
  FiCamera, 
  FiDollarSign, 
  FiCalendar, 
  FiShoppingBag,
  FiUsers,
  FiBarChart,
  FiBell,
  FiSettings,
  FiAward,
  FiGrid
} from 'react-icons/fi'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { usuario, isAdmin, isProfesor, isRepresentante, logout } = useAuth()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      logout()
    }
  }

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'purple'
      case 'profesor': return 'blue'
      case 'representante-delegado': return 'purple'
      case 'representante': return 'green'
      default: return 'gray'
    }
  }

  const getRoleName = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador'
      case 'profesor': return 'Profesor'
      case 'representante-delegado': return 'Representante Delegado'
      case 'representante': return 'Representante'
      default: return 'Usuario'
    }
  }

  return (
    <Box
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      py={3}
      position="sticky"
      top={0}
      zIndex={1000}
      boxShadow="sm"
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        maxW="container.xl"
        mx="auto"
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
        gap={{ base: 3, md: 0 }}
      >
        {/* Logo y botón inicio */}
        <HStack spacing={{ base: 2, md: 4 }} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
          <Link href="/">
            <Button
              leftIcon={<FiHome />}
              colorScheme="blue"
              variant="ghost"
              fontWeight="bold"
            >
              ⚽ Fut360
            </Button>
          </Link>
          {usuario && (
            <Badge colorScheme={getRoleColor(usuario.rol)} fontSize="sm" px={2} py={1}>
              {getRoleName(usuario.rol)}
            </Badge>
          )}
        </HStack>

        {/* Navegación compacta */}
        <HStack
          spacing={2}
          flexWrap={{ base: 'wrap', md: 'nowrap' }}
          justifyContent={{ base: 'flex-end', md: 'flex-start' }}
          width={{ base: '100%', md: 'auto' }}
        >
          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              size="sm"
              leftIcon={<FiGrid />}
              variant="outline"
              px={{ base: 2, md: 3 }}
            >
              <Box as="span" display={{ base: 'none', md: 'inline' }}>
                Aplicaciones
              </Box>
            </MenuButton>
            <MenuList maxW="90vw" maxH="80vh" overflowY="auto">
              {isRepresentante && (
                <>
                  <MenuGroup title="Representante">
                    <MenuItem icon={<FiUsers />} as={Link} href="/ninos">Mis Niños</MenuItem>
                    <MenuItem icon={<FiDollarSign />} as={Link} href="/pago-publico">Pagos</MenuItem>
                    <MenuItem icon={<FiCalendar />} as={Link} href="/calendario">Calendario</MenuItem>
                    <MenuItem icon={<FiShoppingBag />} as={Link} href="/tienda">Tienda</MenuItem>
                  </MenuGroup>
                  <MenuDivider />
                </>
              )}
              {isProfesor && (
                <>
                  <MenuGroup title={usuario?.rol === 'representante-delegado' ? 'Representante Delegado' : 'Profesor'}>
                    <MenuItem icon={<FiAward />} as={Link} href="/torneos">Torneos</MenuItem>
                    <MenuItem icon={<FiUsers />} as={Link} href="/ninos">Gestión de Niños</MenuItem>
                    <MenuItem icon={<FiCalendar />} as={Link} href="/asistencias">Asistencias</MenuItem>
                    <MenuItem icon={<FiCalendar />} as={Link} href="/calendario">Calendario</MenuItem>
                    <MenuItem icon={<FiBell />} as={Link} href="/notificaciones">Notificaciones</MenuItem>
                    <MenuItem icon={<FiShoppingBag />} as={Link} href="/tienda">Tienda</MenuItem>
                  </MenuGroup>
                  <MenuDivider />
                </>
              )}
              {isAdmin && (
                <>
                  <MenuGroup title="Administrador">
                    <MenuItem icon={<FiAward />} as={Link} href="/torneos">Torneos</MenuItem>
                    <MenuItem icon={<FiUsers />} as={Link} href="/representantes">Representantes</MenuItem>
                    <MenuItem icon={<FiUsers />} as={Link} href="/ninos">Niños</MenuItem>
                    <MenuItem icon={<FiUser />} as={Link} href="/calendario/instructores">Gestión de Instructores</MenuItem>
                    <MenuItem icon={<FiCalendar />} as={Link} href="/calendario">Calendario</MenuItem>
                    <MenuItem icon={<FiDollarSign />} as={Link} href="/pagos">Pagos</MenuItem>
                    <MenuItem icon={<FiCamera />} as={Link} href="/checkin">Check-in</MenuItem>
                    <MenuItem icon={<FiBell />} as={Link} href="/notificaciones">Notificaciones</MenuItem>
                    <MenuItem icon={<FiShoppingBag />} as={Link} href="/tienda">Tienda</MenuItem>
                    <MenuItem icon={<FiBarChart />} as={Link} href="/dashboard">Dashboard</MenuItem>
                  </MenuGroup>
                </>
              )}
            </MenuList>
          </Menu>

          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              leftIcon={<FiUser />}
            >
              {usuario?.nombre || 'Usuario'}
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiHome />} as={Link} href="/">
                Inicio
              </MenuItem>
              {(isAdmin || isProfesor) && (
                <MenuItem icon={<FiSettings />} as={Link} href="/dashboard">
                  Dashboard
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem icon={<FiLogOut />} onClick={handleLogout} color="red.500">
                Cerrar Sesión
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  )
}
