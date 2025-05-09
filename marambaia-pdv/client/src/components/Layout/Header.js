// src/components/Layout/Header.js
import React from 'react';
import {
  Flex,
  Box,
  Heading,
  Spacer,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useColorMode
} from '@chakra-ui/react';
import { FiUser, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  
  // Mapear títulos dinâmicos baseados na rota
  const getTitleFromPath = () => {
    const path = location.pathname;
    
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/tables')) return 'Mapa de Mesas';
    if (path.includes('/orders')) return 'Detalhes do Pedido';
    if (path.includes('/products')) return 'Produtos';
    if (path.includes('/categories')) return 'Categorias';
    if (path.includes('/reports')) return 'Relatórios';
    if (path.includes('/settings')) return 'Configurações';
    
    return 'Marambaia Beach RJ';
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      p={4}
      bg="white"
      boxShadow="sm"
    >
      <Heading size="md" color="beach.ocean">
        {getTitleFromPath()}
      </Heading>
      
      <Spacer />
      
      <Flex align="center">
        <IconButton
          icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
          variant="ghost"
          onClick={toggleColorMode}
          aria-label="Alternar tema"
          mr={2}
        />
        
        <Box mr={4}>
          <Text fontWeight="medium">{user?.name || 'Usuário'}</Text>
          <Text fontSize="xs" color="gray.500">
            {user?.role === 'admin' && 'Administrador'}
            {user?.role === 'manager' && 'Gerente'}
            {user?.role === 'waiter' && 'Garçom'}
            {user?.role === 'kitchen' && 'Cozinha'}
          </Text>
        </Box>
        
        <Menu>
          <MenuButton
            as={Avatar}
            size="sm"
            cursor="pointer"
            src=""
            bg="beach.ocean"
            color="white"
            name={user?.name || 'Usuário'}
          />
          <MenuList>
            <MenuItem icon={<FiUser />}>Perfil</MenuItem>
            <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
              Sair
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
};

export default Header;