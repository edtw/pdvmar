// src/components/Layout/ResponsiveLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  useDisclosure, 
  Drawer, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerCloseButton,
  IconButton,
  useBreakpointValue,
  useColorModeValue,
  Slide,
  Text,
  Button
} from '@chakra-ui/react';
import { FiMenu, FiArrowLeft } from 'react-icons/fi';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const ResponsiveLayout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerShadow = scrolled ? 'md' : 'none';
  
  // Verificar se o usuário é garçom
  const isWaiter = user?.role === 'waiter';
  
  // Verificar se está visualizando um pedido (para exibir botão de voltar)
  const isViewingOrder = location.pathname.startsWith('/orders/');
  
  // Detectar rolagem para aplicar sombra no cabeçalho
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Redirecionar garçons para a página de mesas se estiverem em outra rota
  useEffect(() => {
    if (isWaiter && !location.pathname.startsWith('/tables') && !location.pathname.startsWith('/orders')) {
      navigate('/tables');
    }
  }, [isWaiter, location.pathname, navigate]);
  
  // Voltar para a página de mesas ao clicar no botão de voltar
  const handleBackToTables = () => {
    navigate('/tables');
  };
  
  return (
    <Flex h="100vh" overflow="hidden" flexDirection="column">
      {/* Cabeçalho fixo */}
      <Slide direction="top" in={true} style={{ zIndex: 10 }}>
        <Box 
          position="fixed" 
          top="0" 
          left="0" 
          right="0" 
          zIndex="sticky"
          bg={headerBg}
          boxShadow={headerShadow}
          transition="box-shadow 0.3s ease"
        >
          <Flex 
            alignItems="center" 
            pl={isMobile ? 4 : 0}
          >
            {/* Botão do menu para não-garçons OU botão de voltar para garçons na visualização de pedido */}
            {isMobile && (
              <>
                {isWaiter && isViewingOrder ? (
                  <IconButton
                    icon={<FiArrowLeft />}
                    variant="ghost"
                    onClick={handleBackToTables}
                    aria-label="Voltar para mesas"
                    size="lg"
                    mr={2}
                  />
                ) : !isWaiter && (
                  <IconButton
                    icon={<FiMenu />}
                    variant="ghost"
                    onClick={onOpen}
                    aria-label="Menu"
                    size="lg"
                  />
                )}
              </>
            )}
            
            {/* Cabeçalho simplificado para garçons em mobile */}
            {(isMobile && isWaiter && !isViewingOrder) ? (
              <Flex py={4} px={2} alignItems="center" width="100%">
                <Text fontSize="xl" fontWeight="bold">
                  Mesas • Marambaia PDV
                </Text>
              </Flex>
            ) : (
              <Header />
            )}
          </Flex>
        </Box>
      </Slide>
      
      {/* Corpo principal */}
      <Flex 
        flex="1" 
        overflow="hidden" 
        mt="64px" // Altura do cabeçalho
      >
        {/* Sidebar em desktop (não exibir para garçons) */}
        {!isMobile && !isWaiter && (
          <Box 
            w="240px" 
            h="100%" 
            position="fixed" 
            left="0" 
            top="64px" 
            zIndex="docked"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray.400',
                borderRadius: '24px',
              },
            }}
          >
            <Sidebar />
          </Box>
        )}
        
        {/* Sidebar em mobile (drawer) - não exibir para garçons */}
        {isMobile && !isWaiter && (
          <Drawer
            isOpen={isOpen}
            placement="left"
            onClose={onClose}
            size="xs"
          >
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <Box pt="40px" h="100%">
                <Sidebar onClose={onClose} />
              </Box>
            </DrawerContent>
          </Drawer>
        )}
        
        {/* Conteúdo principal - ajustado para garçons */}
        <Box
          as="main"
          flex="1"
          ml={(isMobile || isWaiter) ? 0 : "240px"}
          p={isWaiter && isMobile ? 2 : 4}
          overflowY="auto"
          bg="gray.50"
          _dark={{ bg: "gray.900" }}
          w="full"
        >
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default ResponsiveLayout;