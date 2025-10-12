import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Box,
  Text,
  Image,
  InputGroup,
  InputLeftElement,
  Flex,
  useToast,
  Spinner,
  useBreakpointValue,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagLeftIcon,
  Icon,
  Badge
} from '@chakra-ui/react';
import { FiSearch, FiGrid, FiPackage, FiList, FiLayers, FiCoffee, FiBookOpen, FiCheck } from 'react-icons/fi';
import api, { getImageUrl } from '../../services/api';

const AddItemModal = ({ isOpen, onClose, orderId, onSuccess }) => {
  // Estados
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Todos os produtos
  const [products, setProducts] = useState([]); // Produtos filtrados
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Responsividade
  const gridColumns = useBreakpointValue({ base: 1, sm: 2, md: 3 });
  const modalSize = useBreakpointValue({ base: "full", md: "xl" });
  const chipSize = useBreakpointValue({ base: "sm", md: "md" });
  
  const toast = useToast();
  
  // Categoria especial para "Todos os Produtos"
  const ALL_PRODUCTS_CATEGORY = "all";
  
  // Carregar categorias ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchAllProducts(); // Buscar todos os produtos para pesquisa
    }
  }, [isOpen]);
  
  // Carregar produtos quando uma categoria é selecionada
  useEffect(() => {
    if (selectedCategory) {
      if (selectedCategory === ALL_PRODUCTS_CATEGORY) {
        // Se selecionou "Todos os Produtos", exibir todos os produtos disponíveis
        setProducts(allProducts.filter(product => product.available));
        setLoadingProducts(false);
      } else {
        // Caso contrário, buscar produtos da categoria específica
        fetchProductsByCategory(selectedCategory);
      }
    }
  }, [selectedCategory, allProducts]);
  
  // Efeito para filtrar produtos por termo de busca
  useEffect(() => {
    if (searchTerm) {
      // Se estiver buscando, filtrar todos os produtos pelo termo de busca
      const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setProducts(filteredProducts);
    } else if (selectedCategory) {
      // Se não estiver buscando e tiver categoria selecionada
      if (selectedCategory === ALL_PRODUCTS_CATEGORY) {
        // Se for "Todos os Produtos", exibir todos disponíveis
        setProducts(allProducts.filter(product => product.available));
      } else {
        // Caso contrário, buscar por categoria
        fetchProductsByCategory(selectedCategory);
      }
    }
  }, [searchTerm, allProducts, selectedCategory]);
  
  // Carregar categorias
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
        
        // Selecionar a categoria "Todos os Produtos" por padrão
        setSelectedCategory(ALL_PRODUCTS_CATEGORY);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Carregar todos os produtos (para busca)
  const fetchAllProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await api.get('/products?available=true');
      if (response.data.success) {
        setAllProducts(response.data.products);
        // Inicialmente, mostrar todos os produtos disponíveis
        setProducts(response.data.products.filter(product => product.available));
      }
    } catch (error) {
      console.error('Erro ao carregar todos os produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar todos os produtos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Carregar produtos por categoria
  const fetchProductsByCategory = async (categoryId) => {
    if (!categoryId || categoryId === ALL_PRODUCTS_CATEGORY) return;
    
    setLoadingProducts(true);
    
    try {
      const response = await api.get(`/products/by-category/${categoryId}`);
      if (response.data.success) {
        setProducts(response.data.products.filter(product => product.available));
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
      setLoadingProducts(false);
    }
  };
  
  // Adicionar item ao pedido
  const handleAddItem = async () => {
    if (!selectedProduct) {
      toast({
        title: 'Produto não selecionado',
        description: 'Por favor, selecione um produto',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post(`/orders/${orderId}/items`, {
        productId: selectedProduct._id,
        quantity,
        notes
      });
      
      if (response.data.success) {
        toast({
          title: 'Item adicionado',
          description: 'Item adicionado com sucesso ao pedido',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        // Resetar formulário
        setSelectedProduct(null);
        setQuantity(1);
        setNotes('');
        
        // Callback de sucesso
        if (onSuccess) onSuccess();
        
        // Fechar modal
        onClose();
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao adicionar item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Selecionar produto
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };
  
  // Lidar com a mudança no campo de busca
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Limpar busca
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  // Resetar formulário ao fechar
  const handleClose = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setNotes('');
    setSearchTerm('');
    onClose();
  };
  
  // Obter ícone da categoria
  const getCategoryIcon = (categoryName) => {
    const name = categoryName ? categoryName.toLowerCase() : '';
    
    if (name.includes('bebida') || name.includes('drink')) return FiCoffee;
    if (name.includes('prato') || name.includes('comida')) return FiBookOpen;
    if (name.includes('entrada') || name.includes('aperitivo')) return FiPackage;
    if (name.includes('sobremesa') || name.includes('doce')) return FiGrid;
    
    return FiLayers;
  };
  
  // Renderizar chips de categoria
  const renderCategoryChips = () => {
    if (searchTerm) return null; // Não exibir quando estiver buscando
    
    return (
      <Wrap spacing={2} mb={4}>
        <WrapItem>
          <Tag 
            size={chipSize}
            colorScheme={selectedCategory === ALL_PRODUCTS_CATEGORY ? 'blue' : 'gray'}
            variant={selectedCategory === ALL_PRODUCTS_CATEGORY ? 'solid' : 'subtle'}
            cursor="pointer"
            onClick={() => setSelectedCategory(ALL_PRODUCTS_CATEGORY)}
          >
            <TagLeftIcon as={FiGrid} />
            <TagLabel>Todos os Produtos</TagLabel>
          </Tag>
        </WrapItem>
        
        {categories.map(category => (
          <WrapItem key={category._id}>
            <Tag 
              size={chipSize}
              colorScheme={selectedCategory === category._id ? 'blue' : 'gray'}
              variant={selectedCategory === category._id ? 'solid' : 'subtle'}
              cursor="pointer"
              onClick={() => setSelectedCategory(category._id)}
            >
              <TagLeftIcon as={getCategoryIcon(category.name)} />
              <TagLabel>{category.name}</TagLabel>
            </Tag>
          </WrapItem>
        ))}
      </Wrap>
    );
  };
  
  // Contador de produtos
  const getProductsCount = () => {
    return products.length;
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={modalSize}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Adicionar Item ao Pedido</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Tabs isFitted variant="enclosed" colorScheme="blue">
            <TabList mb="1em">
              <Tab>Produtos</Tab>
              <Tab>Personalizado</Tab>
            </TabList>
            
            <TabPanels>
              {/* Seleção por cards */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {/* Campo de busca */}
                  <FormControl mb={2}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray.300" />
                      </InputLeftElement>
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </InputGroup>
                  </FormControl>
                  
                  {/* Categorias em chips */}
                  {renderCategoryChips()}
                  
                  {/* Seleção de categoria (select - esconder quando estiver usando chips) */}
                  {!renderCategoryChips() && (
                    <FormControl>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value={ALL_PRODUCTS_CATEGORY}>
                          Todos os Produtos
                        </option>
                        {categories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  
                  {/* Feedback de busca */}
                  {searchTerm ? (
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" color="gray.500">
                        Resultados para: "{searchTerm}"
                      </Text>
                      <Button size="xs" onClick={clearSearch}>
                        Limpar busca
                      </Button>
                    </Flex>
                  ) : (
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" color="gray.500">
                        {selectedCategory === ALL_PRODUCTS_CATEGORY 
                          ? 'Todos os produtos disponíveis' 
                          : `Categoria: ${categories.find(c => c._id === selectedCategory)?.name || ''}`}
                      </Text>
                      <Badge colorScheme="blue">{getProductsCount()} produtos</Badge>
                    </Flex>
                  )}
                  
                  {/* Grid de produtos */}
                  {loadingProducts ? (
                    <Flex justify="center" p={6}>
                      <Spinner size="xl" color="blue.500" />
                    </Flex>
                  ) : products.length > 0 ? (
                    <Grid templateColumns={`repeat(${gridColumns}, 1fr)`} gap={3}>
                      {products.map(product => (
                        <Box
                          key={product._id}
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          cursor="pointer"
                          onClick={() => handleSelectProduct(product)}
                          bg={selectedProduct?._id === product._id ? 'blue.50' : 'white'}
                          borderColor={selectedProduct?._id === product._id ? 'blue.500' : 'gray.200'}
                          transition="all 0.2s"
                          _hover={{ shadow: 'md' }}
                          position="relative"
                        >
                          <Image
                            src={getImageUrl(product.image) || 'https://via.placeholder.com/80?text=Produto'}
                            alt={product.name}
                            height="100px"
                            width="100%"
                            objectFit="cover"
                            borderRadius="md"
                            mb={2}
                          />
                          
                          <Text fontWeight="bold" noOfLines={1}>{product.name}</Text>
                          <Text fontSize="sm" color="gray.500" noOfLines={2}>{product.description}</Text>
                          <Text fontWeight="medium" color="blue.600" mt={1}>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(product.price)}
                          </Text>
                          
                          {/* Indicador de seleção */}
                          {selectedProduct?._id === product._id && (
                            <Box
                              position="absolute"
                              top="5px"
                              right="5px"
                              bg="blue.500"
                              color="white"
                              borderRadius="full"
                              p={1}
                              boxSize="24px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Icon as={FiCheck} />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Grid>
                  ) : (
                    <Box textAlign="center" py={6}>
                      <Text>Nenhum produto encontrado</Text>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Seleção manual */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {/* Campo de busca para a aba de seleção manual */}
                  <FormControl mb={2}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray.300" />
                      </InputLeftElement>
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </InputGroup>
                  </FormControl>
                  
                  {/* Categorias em chips */}
                  {renderCategoryChips()}
                  
                  {/* Seleção de categoria */}
                  {!renderCategoryChips() && (
                    <FormControl>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value={ALL_PRODUCTS_CATEGORY}>
                          Todos os Produtos
                        </option>
                        {categories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  
                  <FormControl isRequired>
                    <FormLabel>Produto</FormLabel>
                    <Select
                      placeholder="Selecione um produto"
                      onChange={(e) => {
                        const productId = e.target.value;
                        const product = products.find(p => p._id === productId);
                        setSelectedProduct(product || null);
                      }}
                      value={selectedProduct?._id || ''}
                    >
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} - {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(product.price)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          {/* Informações adicionais */}
          {selectedProduct && (
            <VStack spacing={4} align="stretch" mt={4}>
              <FormControl>
                <FormLabel>Quantidade</FormLabel>
                <NumberInput
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(value) => setQuantity(parseInt(value, 10))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel>Observações</FormLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, bem passado, etc."
                  rows={3}
                />
              </FormControl>
            </VStack>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleAddItem}
            isLoading={loading}
            isDisabled={!selectedProduct}
          >
            Adicionar Item
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddItemModal;