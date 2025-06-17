// src/components/Layout/ResponsiveLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
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
  Slide
} from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';
import Header from './Header';

const ResponsiveLayout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scrolled, setScrolled] = useState(false);
  
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerShadow = scrolled ? 'md' : 'none';
  
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
            {isMobile && (
              <IconButton
                icon={<FiMenu />}
                variant="ghost"
                onClick={onOpen}
                aria-label="Menu"
                size="lg"
              />
            )}
            <Header />
          </Flex>
        </Box>
      </Slide>
      
      {/* Corpo principal */}
      <Flex 
        flex="1" 
        overflow="hidden" 
        mt="64px" // Altura do cabeçalho
      >
        {/* Sidebar em desktop */}
        {!isMobile && (
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
        
        {/* Sidebar em mobile (drawer) */}
        {isMobile && (
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
        
        {/* Conteúdo principal */}
        <Box
          as="main"
          flex="1"
          ml={isMobile ? 0 : "240px"}
          p={4}
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