import React from 'react';
import { Flex, Spinner, Text } from '@chakra-ui/react';

const LoadingScreen = ({ message = 'Carregando...' }) => {
  return (
    <Flex
      width="100vw"
      height="100vh"
      justify="center"
      align="center"
      bg="gray.50"
      direction="column"
      gap={4}
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="xl"
      />
      <Text fontWeight="medium">{message}</Text>
    </Flex>
  );
};

export default LoadingScreen;