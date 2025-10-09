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
  MenuDivider,
  useColorModeValue,
  Tooltip
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
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const shadowColor = useColorModeValue('lg', 'dark-lg');

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
      borderRadius="xl"
      overflow="hidden"
      bg={bgColor}
      shadow="md"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        shadow: shadowColor,
        transform: 'translateY(-4px)',
        borderColor: 'blue.400'
      }}
      position="relative"
      h="100%"
      display="flex"
      flexDirection="column"
    >
      {/* Badge para produtos em destaque */}
      {product.featured && (
        <Badge
          position="absolute"
          top="3"
          right="3"
          colorScheme="orange"
          zIndex="2"
          borderRadius="full"
          px="3"
          py="1"
          fontSize="xs"
          fontWeight="bold"
          boxShadow="md"
        >
          Destaque
        </Badge>
      )}

      {/* Imagem do produto */}
      <Box position="relative" overflow="hidden">
        <Image
          src={product.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}
          alt={product.name}
          height="180px"
          width="100%"
          objectFit="cover"
          opacity={product.available ? 1 : 0.6}
          transition="all 0.3s"
          _hover={{ transform: 'scale(1.05)' }}
        />

        {/* Badge de disponibilidade */}
        <Badge
          position="absolute"
          bottom="3"
          left="3"
          colorScheme={product.available ? 'green' : 'red'}
          borderRadius="full"
          px="3"
          py="1"
          fontSize="xs"
          fontWeight="bold"
          boxShadow="md"
        >
          {product.available ? 'Disponível' : 'Indisponível'}
        </Badge>
      </Box>

      {/* Conteúdo */}
      <Box p="5" flex="1" display="flex" flexDirection="column">
        <Flex justify="space-between" align="flex-start" mb="3" gap="2">
          <Text
            fontWeight="bold"
            fontSize="lg"
            lineHeight="1.3"
            opacity={product.available ? 1 : 0.7}
            flex="1"
            noOfLines={2}
            color={useColorModeValue('gray.800', 'white')}
          >
            {product.name}
          </Text>

          <Menu placement="bottom-end" gutter={8}>
            <Tooltip label="Mais opções" placement="top" hasArrow>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
                aria-label="Opções"
                borderRadius="full"
                colorScheme="gray"
                _hover={{ bg: hoverBg }}
                _active={{ bg: hoverBg }}
                flexShrink={0}
              />
            </Tooltip>
            <MenuList
              shadow="xl"
              borderRadius="lg"
              py="2"
              minW="200px"
              zIndex="dropdown"
            >
              <MenuItem
                icon={<FiEye size={16} />}
                onClick={onView}
                borderRadius="md"
                mx="1"
                _hover={{ bg: hoverBg }}
                fontSize="sm"
                fontWeight="500"
              >
                Detalhes
              </MenuItem>
              <MenuItem
                icon={<FiEdit size={16} />}
                onClick={onEdit}
                borderRadius="md"
                mx="1"
                _hover={{ bg: hoverBg }}
                fontSize="sm"
                fontWeight="500"
              >
                Editar
              </MenuItem>
              <MenuItem
                icon={product.available ? <FiXCircle size={16} /> : <FiCheckCircle size={16} />}
                onClick={onToggleAvailability}
                borderRadius="md"
                mx="1"
                _hover={{ bg: hoverBg }}
                fontSize="sm"
                fontWeight="500"
              >
                {product.available ? 'Desativar' : 'Ativar'}
              </MenuItem>
              <MenuDivider my="1" />
              <MenuItem
                icon={<FiTrash2 size={16} />}
                onClick={onDelete}
                borderRadius="md"
                mx="1"
                _hover={{ bg: 'red.50', color: 'red.600' }}
                color="red.500"
                fontSize="sm"
                fontWeight="500"
              >
                Excluir
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>

        <Text
          fontSize="sm"
          color="gray.500"
          noOfLines={2}
          mb="4"
          opacity={product.available ? 1 : 0.7}
          lineHeight="1.5"
          flex="1"
        >
          {product.description || 'Sem descrição'}
        </Text>

        <Flex justify="space-between" align="center" mt="auto" gap="2">
          <Text
            fontWeight="bold"
            fontSize="xl"
            color="blue.600"
            opacity={product.available ? 1 : 0.7}
          >
            {formatPrice(product.price)}
          </Text>

          <Badge
            colorScheme="blue"
            borderRadius="full"
            px="3"
            py="1"
            fontSize="xs"
            fontWeight="semibold"
          >
            {product.category?.name || 'Sem categoria'}
          </Badge>
        </Flex>
      </Box>
    </Box>
  );
};

export default ProductCard;