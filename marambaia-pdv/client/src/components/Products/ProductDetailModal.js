import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Image,
  Box,
  Text,
  Badge,
  Divider,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue
} from '@chakra-ui/react';

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  if (!product) return null;
  
  // Formato de moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Detalhes do Produto</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Box>
            {/* Imagem do produto */}
            <Image
              src={product.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}
              alt={product.name}
              maxH="300px"
              w="full"
              objectFit="cover"
              borderRadius="md"
            />
            
            {/* Informações básicas */}
            <Box mt={4}>
              <Flex justify="space-between" align="center">
                <Text fontSize="2xl" fontWeight="bold">{product.name}</Text>
                <Badge 
                  colorScheme={product.available ? 'green' : 'red'}
                  fontSize="0.8em"
                  p={1}
                >
                  {product.available ? 'Disponível' : 'Indisponível'}
                </Badge>
              </Flex>
              
              <Text color="gray.500" fontSize="md" mt={1}>{product.description}</Text>
              
              <Divider my={4} />
              
              {/* Estatísticas */}
              <Flex wrap="wrap" justify="space-between" gap={2}>
                <Stat>
                  <StatLabel>Preço</StatLabel>
                  <StatNumber>{formatCurrency(product.price)}</StatNumber>
                </Stat>
                
                <Stat>
                  <StatLabel>Categoria</StatLabel>
                  <StatNumber fontSize="lg">{product.category?.name || 'Sem categoria'}</StatNumber>
                </Stat>
                
                <Stat>
                  <StatLabel>Tempo de Preparo</StatLabel>
                  <StatNumber>{product.preparationTime || 10} min</StatNumber>
                </Stat>
              </Flex>
              
              {/* Status especiais */}
              <Flex mt={4} gap={2}>
                {product.featured && (
                  <Badge colorScheme="orange" p={1}>
                    Destaque
                  </Badge>
                )}
              </Flex>
            </Box>
          </Box>
        </ModalBody>
        
        <ModalFooter>
          <Button onClick={onClose}>Fechar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductDetailModal;