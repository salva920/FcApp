'use client'

import {
  Box,
  Flex,
  Heading,
  Button,
  HStack,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  Text,
  MenuGroup
} from '@chakra-ui/react'
import { 
  FiHome, 
  FiLogOut, 
  FiUser, 
  FiCamera, 
  FiDollarSign, 
  FiSearch, 
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
      case 'representante': return 'green'
      default: return 'gray'
    }
  }

  const getRoleName = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador'
      case 'profesor': return 'Profesor'
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
      <Flex justifyContent="space-between" alignItems="center" maxW="container.xl" mx="auto">
        {/* Logo y botón inicio */}
        <HStack spacing={4}>
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
        <HStack spacing={2}>
          <Menu>
            <MenuButton as={Button} size="sm" leftIcon={<FiGrid />} variant="outline">
              Aplicaciones
            </MenuButton>
            <MenuList>
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
                  <MenuGroup title="Profesor">
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
