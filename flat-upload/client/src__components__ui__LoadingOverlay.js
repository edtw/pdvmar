import React from 'react';
import { Flex, Spinner, Text } from '@chakra-ui/react';

const LoadingOverlay = ({ message = 'Carregando...' }) => {
  return (
    <Flex
      position="absolute"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.300"
      zIndex="overlay"
      justify="center"
      align="center"
      direction="column"
      gap={3}
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

export default LoadingOverlay;