// src/components/Layout/index.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <Flex h="100vh" overflow="hidden">
      <Sidebar />
      <Flex flexDirection="column" flex="1" overflow="hidden">
        <Header />
        <Box
          as="main"
          flex="1"
          p={4}
          overflowY="auto"
          bg="gray.50"
        >
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;