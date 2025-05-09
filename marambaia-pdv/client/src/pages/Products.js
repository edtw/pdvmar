// src/pages/Products.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Grid,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  useDisclosure,
  IconButton,
  Badge,
  useToast,
  useColorModeValue,
  Spinner,
  Center
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';
import api from '../services/api';

// Componentes
import ProductCard from '../components/Products/ProductCard';
import ProductFormModal from '../components/Products/ProductFormModal';
import ProductDetailModal from '../components/Products/ProductDetailModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';

const Products = () => {
  // Estados
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Disclosure hooks para modais
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose
  } = useDisclosure();
  
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose
  } = useDisclosure();
  
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose
  } = useDisclosure();
  
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Carregar produtos
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Construir parâmetros de busca
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (filterCategory) {
        params.append('category', filterCategory);
      }
      
      if (filterAvailability !== 'all') {
        params.append('available', filterAvailability === 'available');
      }
      
      const response = await api.get(`/products?${params.toString()}`);
      
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCategory, filterAvailability, toast]);
  
  // Carregar categorias
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, []);
  
  // Carregar dados iniciais
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);
  
  // Editar produto
  const handleEdit = (product) => {
    setSelectedProduct(product);
    onEditOpen();
  };
  
  // Ver detalhes do produto
  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    onDetailOpen();
  };
  
  // Confirmar exclusão
  const handleDelete = (product) => {
    setSelectedProduct(product);
    onDeleteOpen();
  };
  
  // Excluir produto
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/products/${selectedProduct._id}`);
      
      if (response.data.success) {
        toast({
          title: 'Produto excluído',
          description: 'Produto excluído com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Atualizar lista
        fetchProducts();
        onDeleteClose();
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir produto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onDeleteClose();
    }
  };
  
  // Alternar disponibilidade do produto
  const toggleAvailability = async (product) => {
    try {
      const response = await api.patch(`/products/${product._id}/availability`, {
        available: !product.available
      });
      
      if (response.data.success) {
        toast({
          title: product.available ? 'Produto indisponível' : 'Produto disponível',
          description: `O produto foi marcado como ${product.available ? 'indisponível' : 'disponível'}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        // Atualizar lista
        fetchProducts();
      }
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar disponibilidade do produto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Renderizar lista de produtos
  const renderProducts = () => {
    if (loading) {
      return (
        <Center h="200px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      );
    }
    
    if (products.length === 0) {
      return (
        <EmptyState 
          title="Nenhum produto encontrado"
          description={
            searchTerm || filterCategory || filterAvailability !== 'all'
              ? "Tente ajustar os filtros de busca"
              : "Clique no botão 'Novo Produto' para adicionar"
          }
          button={{
            text: 'Novo Produto',
            onClick: onCreateOpen
          }}
        />
      );
    }
    
    return (
      <Grid 
        templateColumns={{
          base: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
          xl: 'repeat(5, 1fr)'
        }}
        gap={4}
      >
        {products.map(product => (
          <ProductCard
            key={product._id}
            product={product}
            onEdit={() => handleEdit(product)}
            onView={() => handleViewDetails(product)}
            onDelete={() => handleDelete(product)}
            onToggleAvailability={() => toggleAvailability(product)}
          />
        ))}
      </Grid>
    );
  };
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        mb={6}
        flexDirection={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Box>
          <Heading size="lg">Produtos</Heading>
          <Text color="gray.500">Gerencie o cardápio do restaurante</Text>
        </Box>
        
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={onCreateOpen}
        >
          Novo Produto
        </Button>
      </Flex>
      
      {/* Filtros */}
      <Flex 
        mb={6} 
        gap={4} 
        flexDirection={{ base: 'column', md: 'row' }}
      >
        <InputGroup maxW={{ md: '320px' }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
          />
        </InputGroup>
        
        <Select
          placeholder="Todas as categorias"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          maxW={{ md: '200px' }}
        >
          {categories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </Select>
        
        <Select
          value={filterAvailability}
          onChange={(e) => setFilterAvailability(e.target.value)}
          maxW={{ md: '200px' }}
        >
          <option value="all">Todos os produtos</option>
          <option value="available">Disponíveis</option>
          <option value="unavailable">Indisponíveis</option>
        </Select>
        
        <IconButton
          icon={<FiRefreshCw />}
          aria-label="Atualizar"
          onClick={fetchProducts}
          isLoading={loading}
        />
      </Flex>
      
      {/* Lista de produtos */}
      {renderProducts()}
      
      {/* Modais */}
      <ProductFormModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        categories={categories}
        onSuccess={fetchProducts}
      />
      
      {selectedProduct && (
        <>
          <ProductFormModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            categories={categories}
            product={selectedProduct}
            onSuccess={fetchProducts}
          />
          
          <ProductDetailModal
            isOpen={isDetailOpen}
            onClose={onDetailClose}
            product={selectedProduct}
          />
        </>
      )}
      
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={confirmDelete}
        title="Excluir Produto"
        message={selectedProduct ? `Tem certeza que deseja excluir o produto "${selectedProduct.name}"? Esta ação não pode ser desfeita.` : ''}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default Products;