// src/components/Layout/Sidebar.js (melhorado)
import React from 'react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  Icon,
  Text,
  Link,
  Divider,
  Heading,
  Image,
  Tooltip,
  useColorModeValue,
  Badge,
  Button,
  useMediaQuery
} from '@chakra-ui/react';
import {
  FiHome,
  FiGrid,
  FiClipboard,
  FiPackage,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiInfo
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  
  const bgColor = useColorModeValue('beach.ocean', 'gray.800');
  const textColor = useColorModeValue('white', 'white');
  const activeItemBg = useColorModeValue('rgba(255,255,255,0.2)', 'gray.700');
  const hoverBg = useColorModeValue('rgba(255,255,255,0.1)', 'gray.700');
  const dividerColor = useColorModeValue('rgba(255,255,255,0.2)', 'gray.600');
  
  // Lista de items do menu com controle de acesso
  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: FiHome, 
      path: '/dashboard', 
      roles: ['admin', 'manager', 'waiter', 'kitchen'] 
    },
    { 
      name: 'Mesas', 
      icon: FiGrid, 
      path: '/tables', 
      roles: ['admin', 'manager', 'waiter'] 
    },
    { 
      name: 'Produtos', 
      icon: FiPackage, 
      path: '/products', 
      roles: ['admin', 'manager'] 
    },
    { 
      name: 'Gestão de Caixa', 
      icon: FiDollarSign, 
      path: '/cash', 
      roles: ['admin', 'manager', 'waiter'] 
    },
    { 
      name: 'Categorias', 
      icon: FiClipboard, 
      path: '/categories', 
      roles: ['admin', 'manager'] 
    },
    { 
      name: 'Relatórios', 
      icon: FiBarChart2, 
      path: '/reports', 
      roles: ['admin', 'manager'] 
    },
    { 
      name: 'Usuários', 
      icon: FiUsers, 
      path: '/users', 
      roles: ['admin', 'manager'] 
    },
    { 
      name: 'Configurações', 
      icon: FiSettings, 
      path: '/settings', 
      roles: ['admin'] 
    }
  ];
  
  // Filtrar items pelo perfil do usuário
  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );
  
  const handleItemClick = () => {
    // Fechar menu móvel quando um item é clicado
    if (onClose && !isLargerThan768) {
      onClose();
    }
  };
  
  return (
    <Box
      bg={bgColor}
      color={textColor}
      w="full"
      h="full"
      paddingTop="2"
      paddingBottom="6"
      overflowY="auto"
      position="relative"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '24px',
        },
      }}
    >
      {/* Logo/Título no Mobile */}
      <Flex px="4" py="5" align="center" display={{ base: 'flex', lg: 'none' }}>
        <Image 
          src="/logo.png" 
          alt="Marambaia Beach" 
          boxSize="32px"
          objectFit="contain"
          mr={3}
          fallbackSrc="https://via.placeholder.com/32?text=MB"
        />
        <Text fontSize="xl" fontWeight="bold" textAlign="left">
          Marambaia PDV
        </Text>
      </Flex>
      
      <Divider borderColor={dividerColor} opacity={0.3} />
      
      {/* Perfil do Usuário */}
      <Flex p="4" direction="column" align="flex-start">
        <Text fontSize="sm" color="whiteAlpha.700" mb={1}>
          Logado como
        </Text>
        <Text fontWeight="medium" fontSize="md">{user?.name}</Text>
        <Badge 
          variant="solid" 
          colorScheme={
            user?.role === 'admin' ? 'purple' : 
            user?.role === 'manager' ? 'blue' :
            user?.role === 'waiter' ? 'green' : 'orange'
          }
          mt={1}
          size="sm"
        >
          {user?.role === 'admin' && 'Administrador'}
          {user?.role === 'manager' && 'Gerente'}
          {user?.role === 'waiter' && 'Garçom'}
          {user?.role === 'kitchen' && 'Cozinha'}
        </Badge>
      </Flex>
      
      <Divider borderColor={dividerColor} opacity={0.3} mb={4} />
      
      {/* Menu de Navegação */}
      <VStack spacing={1} align="stretch">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            as={RouterLink}
            to={item.path}
            _hover={{ textDecoration: 'none' }}
            onClick={handleItemClick}
          >
            <Tooltip 
              label={item.name} 
              placement="right" 
              hasArrow
              openDelay={500}
            >
              <Flex
                align="center"
                p="3"
                mx="3"
                borderRadius="md"
                role="group"
                cursor="pointer"
                bg={location.pathname === item.path ? activeItemBg : "transparent"}
                _hover={{
                  bg: hoverBg,
                }}
                transition="all 0.2s"
              >
                <Icon
                  mr="4"
                  fontSize="18"
                  as={item.icon}
                  opacity={location.pathname === item.path ? 1 : 0.8}
                />
                <Text 
                  fontSize="md" 
                  fontWeight={location.pathname === item.path ? "semibold" : "medium"}
                  opacity={location.pathname === item.path ? 1 : 0.8}
                >
                  {item.name}
                </Text>
              </Flex>
            </Tooltip>
          </Link>
        ))}
      </VStack>
      
      {/* Rodapé/Versão */}
      <Box position="absolute" bottom="0" width="100%" p="4">
        <Divider borderColor={dividerColor} opacity={0.3} mb={4} />
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color="whiteAlpha.600">v1.1.0</Text>
          <Button 
            variant="outline" 
            size="xs" 
            leftIcon={<FiLogOut />} 
            color="whiteAlpha.800"
            borderColor="whiteAlpha.400"
            _hover={{ bg: hoverBg }}
            onClick={logout}
          >
            Sair
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default Sidebar;