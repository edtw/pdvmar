// src/components/Products/ProductCard.js
import React from 'react';
import {
  Box,
  Image,
  Text,
  Badge,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

const ProductCard = ({ 
  product, 
  onEdit, 
  onView, 
  onDelete, 
  onToggleAvailability 
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Formatar preço
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };
  
  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
      position="relative"
    >
      {/* Badge para produtos em destaque */}
      {product.featured && (
        <Badge
          position="absolute"
          top="2"
          right="2"
          colorScheme="orange"
          zIndex="1"
        >
          Destaque
        </Badge>
      )}
      
      {/* Imagem do produto */}
      <Image
        src={product.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}
        alt={product.name}
        height="160px"
        width="100%"
        objectFit="cover"
        opacity={product.available ? 1 : 0.6}
      />
      
      {/* Badge de disponibilidade */}
      <Badge
        position="absolute"
        top="140px"
        left="2"
        colorScheme={product.available ? 'green' : 'red'}
      >
        {product.available ? 'Disponível' : 'Indisponível'}
      </Badge>
      
      {/* Conteúdo */}
      <Box p="4">
        <Flex justify="space-between" align="center" mb="2">
          <Text
            fontWeight="bold"
            fontSize="lg"
            noOfLines={1}
            opacity={product.available ? 1 : 0.7}
          >
            {product.name}
          </Text>
          
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
              aria-label="Opções"
            />
            <MenuList>
              <MenuItem icon={<FiEye />} onClick={onView}>
                Detalhes
              </MenuItem>
              <MenuItem icon={<FiEdit />} onClick={onEdit}>
                Editar
              </MenuItem>
              <MenuItem 
                icon={product.available ? <FiXCircle /> : <FiCheckCircle />} 
                onClick={onToggleAvailability}
              >
                {product.available ? 'Marcar como indisponível' : 'Marcar como disponível'}
              </MenuItem>
              <MenuItem icon={<FiTrash2 />} onClick={onDelete} color="red.500">
                Excluir
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        
        <Text 
          fontSize="sm" 
          color="gray.500" 
          noOfLines={2} 
          mb="2"
          opacity={product.available ? 1 : 0.7}
        >
          {product.description || 'Sem descrição'}
        </Text>
        
        <Flex justify="space-between" align="center">
          <Text 
            fontWeight="bold" 
            color="blue.600"
            opacity={product.available ? 1 : 0.7}
          >
            {formatPrice(product.price)}
          </Text>
          
          <Badge colorScheme="blue">
            {product.category?.name || 'Sem categoria'}
          </Badge>
        </Flex>
      </Box>
    </Box>
  );
};

export default ProductCard;