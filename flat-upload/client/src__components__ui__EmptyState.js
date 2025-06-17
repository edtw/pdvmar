import React from 'react';
import { Box, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ 
  title = 'Nenhum item encontrado', 
  description = 'Não encontramos nenhum resultado para mostrar.',
  icon = FiInbox,
  button = null
}) => {
  return (
    <Box
      textAlign="center"
      py={10}
      px={6}
      borderRadius="md"
      bg="white"
      shadow="sm"
    >
      <VStack spacing={3}>
        <Icon as={icon} boxSize="50px" color="gray.500" />
        
        <Heading as="h2" size="lg">
          {title}
        </Heading>
        
        <Text color={'gray.500'}>
          {description}
        </Text>
        
        {button && (
          <Button
            colorScheme="blue"
            mt={4}
            onClick={button.onClick}
          >
            {button.text}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default EmptyState;