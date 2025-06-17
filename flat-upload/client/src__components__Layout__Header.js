// src/components/Layout/Header.js (melhorado)
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
  useColorMode,
  HStack,
  Image,
  useBreakpointValue,
  useColorModeValue,
  Badge
} from '@chakra-ui/react';
import { FiUser, FiLogOut, FiMoon, FiSun, FiBell, FiChevronDown } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('white', 'gray.800');
  const brandColor = useColorModeValue('beach.ocean', 'beach.seafoam');
  const textColor = useColorModeValue('gray.800', 'white');
  
  // Mapear títulos dinâmicos baseados na rota
  const getTitleFromPath = () => {
    const path = location.pathname;
    
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/tables')) return 'Mapa de Mesas';
    if (path.includes('/orders')) return 'Detalhes do Pedido';
    if (path.includes('/products')) return 'Produtos';
    if (path.includes('/categories')) return 'Categorias';
    if (path.includes('/users')) return 'Usuários';
    if (path.includes('/reports')) return 'Relatórios';
    if (path.includes('/settings')) return 'Configurações';
    if (path.includes('/cash')) return 'Gestão de Caixa';
    
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
      py={3}
      px={5}
      w="full"
      h="64px"
    >
      {/* Logo em desktop */}
      {!isMobile && (
        <Box w="240px" ml={-5} pl={6}>
          <HStack spacing={3}>
            <Image 
              src="/logo.png" 
              alt="Marambaia Beach" 
              boxSize="32px"
              objectFit="contain"
              fallbackSrc="https://via.placeholder.com/32?text=MB"
            />
            <Heading size="md" color={brandColor} display={{ base: 'none', lg: 'block' }}>
              Marambaia
            </Heading>
          </HStack>
        </Box>
      )}
      
      {/* Título da página */}
      <Heading 
        size={isMobile ? "sm" : "md"} 
        color={textColor}
        lineHeight="short"
        noOfLines={1}
      >
        {getTitleFromPath()}
      </Heading>
      
      <Spacer />
      
      {/* Controles do usuário */}
      <HStack spacing={{ base: 1, md: 4 }}>
        {/* Alternador de tema */}
        <IconButton
          icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
          variant="ghost"
          onClick={toggleColorMode}
          aria-label="Alternar tema"
          size={isMobile ? "sm" : "md"}
        />
        
        {/* Menu do usuário */}
        <Menu>
          <MenuButton
            as={Box}
            cursor="pointer"
            display="flex"
            alignItems="center"
          >
            <HStack spacing={2}>
              <Avatar
                size={isMobile ? "sm" : "sm"}
                bg="beach.ocean"
                color="white"
                name={user?.name || 'Usuário'}
                src=""
              />
              {!isMobile && (
                <Flex direction="column" alignItems="flex-start">
                  <Text fontWeight="medium" fontSize="sm" noOfLines={1} maxW="120px">
                    {user?.name || 'Usuário'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    <Badge 
                      variant="subtle" 
                      colorScheme={
                        user?.role === 'admin' ? 'purple' : 
                        user?.role === 'manager' ? 'blue' :
                        user?.role === 'waiter' ? 'green' : 'orange'
                      }
                      fontSize="2xs"
                    >
                      {user?.role === 'admin' && 'Administrador'}
                      {user?.role === 'manager' && 'Gerente'}
                      {user?.role === 'waiter' && 'Garçom'}
                      {user?.role === 'kitchen' && 'Cozinha'}
                    </Badge>
                  </Text>
                </Flex>
              )}
              <FiChevronDown size={16} />
            </HStack>
          </MenuButton>
          <MenuList zIndex={1001}>
            <MenuItem icon={<FiUser />} onClick={() => navigate('/users')}>
              Minha Conta
            </MenuItem>
            <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
              Sair
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

export default Header;