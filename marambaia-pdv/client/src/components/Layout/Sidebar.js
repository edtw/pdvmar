// src/components/Layout/Sidebar.js
import React from 'react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  Icon,
  Text,
  Divider,
  Link,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  useBreakpointValue
} from '@chakra-ui/react';
import {
  FiHome,
  FiGrid,
  FiClipboard,
  FiPackage,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const SidebarContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  
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
  
  return (
    <Box
      bg="beach.ocean"
      color="white"
      w="full"
      h="full"
      paddingTop="5"
      shadow="lg"
    >
      <Flex px="4" py="5" align="center">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center" w="full">
          Marambaia PDV
        </Text>
      </Flex>
      <Divider borderColor="whiteAlpha.400" />
      <VStack spacing={2} align="stretch" mt={6}>
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            as={RouterLink}
            to={item.path}
            _hover={{ textDecoration: 'none' }}
          >
            <Flex
              align="center"
              p="3"
              mx="3"
              borderRadius="md"
              role="group"
              cursor="pointer"
              bg={location.pathname === item.path ? "whiteAlpha.200" : "transparent"}
              _hover={{
                bg: "whiteAlpha.200",
              }}
            >
              <Icon
                mr="4"
                fontSize="20"
                as={item.icon}
              />
              <Text fontSize="md" fontWeight="medium">{item.name}</Text>
            </Flex>
          </Link>
        ))}
      </VStack>
    </Box>
  );
};

const Sidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  
  if (isMobile) {
    return (
      <>
        <IconButton
          aria-label="Menu"
          icon={<FiMenu />}
          size="md"
          position="fixed"
          top="4"
          left="4"
          zIndex="overlay"
          colorScheme="blue"
          onClick={onOpen}
        />
        <Drawer
          isOpen={isOpen}
          placement="left"
          onClose={onClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <Flex justifyContent="flex-end" p="2">
              <IconButton
                icon={<FiX />}
                aria-label="Fechar menu"
                onClick={onClose}
              />
            </Flex>
            <DrawerBody p="0">
              <SidebarContent />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
  
  return (
    <Box w="64" h="full" position="relative">
      <SidebarContent />
    </Box>
  );
};

export default Sidebar;