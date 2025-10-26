// pages/Menu.js - Enhanced with World-Class UI/UX
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, VStack, HStack, Heading, Text, Button, Grid, Image,
  Tabs, TabList, TabPanels, Tab, TabPanel, Badge, Spinner,
  useToast, Flex, ScaleFade, useColorModeValue, Icon, Center, Skeleton
} from '@chakra-ui/react';
import { publicAPI, getImageUrl } from '../services/api';
import { ProductCardSkeleton } from '../components/SkeletonCard';
import { useSocket } from '../contexts/SocketContext';

const Menu = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const cartButtonRef = useRef(null);
  const { joinOrderRoom, leaveOrderRoom, onOrderUpdate } = useSocket();

  // Move hook to top level (before any conditions)
  const bgGradient = useColorModeValue(
    'linear(to-br, brand.50, tropical.50)',
    'linear(to-br, gray.900, gray.800)'
  );

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [order, setOrder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [upsellSuggestions, setUpsellSuggestions] = useState([]);

  useEffect(() => {
    loadData();
    loadRecommendations();
    loadUpsellSuggestions();

    // Join order room for real-time updates
    if (orderId) {
      joinOrderRoom(orderId);
    }

    // Listen for order updates
    const unsubscribe = onOrderUpdate?.((data) => {
      console.log('[Menu] Order update received:', data);

      // If order data is included in the event, use it directly
      if (data.order) {
        console.log('[Menu] Using order data from socket event');
        setOrder(data.order);
      } else {
        // Fallback: reload all data from API
        console.log('[Menu] Reloading data from API');
        loadData();
      }
    });

    // Cleanup
    return () => {
      if (orderId) {
        leaveOrderRoom(orderId);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, orderRes] = await Promise.all([
        publicAPI.getProducts(),
        publicAPI.getCategories(),
        publicAPI.getOrder(orderId)
      ]);

      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
      setOrder(orderRes.data.order);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast({
        title: 'Erro ao carregar dados',
        description: err.response?.data?.message || 'Tente novamente',
        status: 'error',
        duration: 3000
      });
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const orderRes = await publicAPI.getOrder(orderId);
      const customerId = orderRes.data.order?.customer?._id;

      if (customerId) {
        const response = await publicAPI.getRecommendations(customerId);
        setRecommendations(response.data.recommendations || []);
      }
    } catch (err) {
      console.error('Erro ao carregar recomendações:', err);
    }
  };

  const loadUpsellSuggestions = async () => {
    try {
      const response = await publicAPI.getUpsellSuggestions(orderId);
      setUpsellSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err);
    }
  };

  const handleAddItem = async (product, buttonRef) => {
    try {
      // Animate to cart
      if (buttonRef && cartButtonRef.current) {
        animateToCart(buttonRef, cartButtonRef.current);
      }

      await publicAPI.addItem(orderId, {
        productId: product._id,
        quantity: 1
      });

      toast({
        title: 'Item adicionado!',
        description: `${product.name} está no seu pedido`,
        status: 'success',
        duration: 2000,
        position: 'top',
      });

      loadData();
      loadUpsellSuggestions(); // Atualizar sugestões após adicionar item
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao adicionar item',
        status: 'error',
        duration: 3000
      });
    }
  };

  // Simple add-to-cart animation
  const animateToCart = (sourceEl, cartEl) => {
    const sourceRect = sourceEl.getBoundingClientRect();
    const cartRect = cartEl.getBoundingClientRect();

    const flyingItem = document.createElement('div');
    flyingItem.style.cssText = `
      position: fixed;
      left: ${sourceRect.left + sourceRect.width / 2}px;
      top: ${sourceRect.top + sourceRect.height / 2}px;
      width: 40px;
      height: 40px;
      background: #0891B2;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(8, 145, 178, 0.4);
    `;
    document.body.appendChild(flyingItem);

    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    flyingItem.animate([
      { transform: `translate(0, 0) scale(1)`, opacity: 1 },
      { transform: `translate(${(endX - sourceRect.left) / 2}px, ${(endY - sourceRect.top) / 2 - 50}px) scale(0.8)`, opacity: 0.9, offset: 0.5 },
      { transform: `translate(${endX - sourceRect.left}px, ${endY - sourceRect.top}px) scale(0.2)`, opacity: 0 }
    ], {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    }).onfinish = () => flyingItem.remove();

    // Pulse cart button
    cartEl.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.2)' },
      { transform: 'scale(1)' },
    ], { duration: 300 });
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category?._id === selectedCategory)
    : products;

  const itemCount = order?.items?.length || 0;

  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient} pb={20}>
        <Container maxW="container.lg" py={4}>
          <VStack spacing={6} align="stretch">
            {/* Header Skeleton */}
            <Skeleton height="100px" borderRadius="xl" />

            {/* Category Tabs Skeleton */}
            <Skeleton height="60px" borderRadius="xl" />

            {/* Product Grid Skeleton */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </Grid>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient} pb={20}>
      <Container maxW="container.lg" py={4}>
        <VStack spacing={6} align="stretch">
          {/* Header with Cart */}
          <Flex
            justify="space-between"
            align="center"
            bg="white"
            p={4}
            borderRadius="2xl"
            boxShadow="xl"
            position="sticky"
            top={4}
            zIndex={10}
          >
            <Box>
              <Heading size="lg" color="brand.600" mb={1}>
                Cardápio
              </Heading>
              <HStack spacing={2}>
                <Badge colorScheme="brand" fontSize="md" px={3} py={1} borderRadius="full">
                  Mesa {order?.table?.number}
                </Badge>
              </HStack>
            </Box>

            <Button
              ref={cartButtonRef}
              colorScheme="brand"
              size="lg"
              onClick={() => navigate(`/my-order/${orderId}`)}
              position="relative"
              minH="56px"
              px={6}
              borderRadius="full"
              boxShadow="md"
              _hover={{ transform: 'scale(1.05)', boxShadow: 'xl' }}
              transition="all 0.2s"
            >
              {itemCount > 0 && (
                <Badge
                  colorScheme="sunset"
                  borderRadius="full"
                  position="absolute"
                  top="-8px"
                  right="-8px"
                  fontSize="sm"
                  minW="28px"
                  h="28px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  px={2}
                  border="3px solid white"
                >
                  {itemCount}
                </Badge>
              )}
              Ver Pedido
            </Button>
          </Flex>

          {/* Recomendações Personalizadas */}
          {recommendations.length > 0 && (
            <Box bg="white" borderRadius="2xl" p={6} boxShadow="xl" border="2px solid" borderColor="brand.100">
              <VStack align="stretch" spacing={4}>
                <HStack spacing={2}>
                  <Badge colorScheme="brand" fontSize="md" px={3} py={1} borderRadius="full">
                    ⭐ Recomendado para você
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Baseado no seu perfil e preferências
                </Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  {recommendations.slice(0, 4).map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onAdd={handleAddItem}
                      isRecommended
                    />
                  ))}
                </Grid>
              </VStack>
            </Box>
          )}

          {/* Sugestões de Upselling */}
          {upsellSuggestions.length > 0 && (
            <Box bg="gradient-to-br from-sunset.50 to-sunset.100" borderRadius="2xl" p={6} boxShadow="xl">
              <VStack align="stretch" spacing={4}>
                <HStack spacing={2}>
                  <Badge colorScheme="sunset" fontSize="md" px={3} py={1} borderRadius="full">
                    💡 Que tal adicionar?
                  </Badge>
                </HStack>
                <VStack align="stretch" spacing={3}>
                  {upsellSuggestions.slice(0, 3).map((suggestion) => (
                    <Box
                      key={suggestion.product._id}
                      bg="white"
                      p={4}
                      borderRadius="xl"
                      boxShadow="md"
                      _hover={{ transform: 'translateX(4px)', boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="bold" fontSize="md" color="gray.800">
                            {suggestion.product.name}
                          </Text>
                          <Text fontSize="sm" color="sunset.700" fontWeight="medium">
                            {suggestion.reason}
                          </Text>
                          <Text fontSize="lg" fontWeight="bold" color="brand.600">
                            R$ {suggestion.product.price?.toFixed(2)}
                          </Text>
                        </VStack>
                        <Button
                          colorScheme="sunset"
                          size="sm"
                          onClick={() => handleAddItem(suggestion.product)}
                          borderRadius="full"
                          px={6}
                        >
                          Adicionar
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </Box>
          )}

          {/* Category Tabs */}
          <Tabs
            variant="soft-rounded"
            colorScheme="brand"
            onChange={(index) => {
              setSelectedCategory(index === 0 ? null : categories[index - 1]?._id);
            }}
          >
            <Box bg="white" borderRadius="2xl" p={4} boxShadow="md" mb={4}>
              <TabList overflowX="auto" pb={2} css={{
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none'
              }}>
                <Tab fontWeight="semibold" fontSize="md" minH="48px">Todos</Tab>
                {categories.map(cat => (
                  <Tab key={cat._id} fontWeight="semibold" fontSize="md" whiteSpace="nowrap" minH="48px">
                    {cat.name}
                  </Tab>
                ))}
              </TabList>
            </Box>

            <TabPanels>
              <TabPanel px={0}>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  {filteredProducts.map((product, index) => (
                    <ScaleFade key={product._id} initialScale={0.9} in={true} delay={index * 0.05}>
                      <ProductCard
                        product={product}
                        onAdd={handleAddItem}
                      />
                    </ScaleFade>
                  ))}
                </Grid>
              </TabPanel>
              {categories.map(cat => (
                <TabPanel key={cat._id} px={0}>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                    {products.filter(p => p.category?._id === cat._id).map((product, index) => (
                      <ScaleFade key={product._id} initialScale={0.9} in={true} delay={index * 0.05}>
                        <ProductCard
                          product={product}
                          onAdd={handleAddItem}
                        />
                      </ScaleFade>
                    ))}
                  </Grid>
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
};

// Enhanced Product Card Component
const ProductCard = ({ product, onAdd, isRecommended }) => {
  const [isAdding, setIsAdding] = useState(false);
  const buttonRef = useRef(null);

  const handleAdd = async () => {
    setIsAdding(true);
    await onAdd(product, buttonRef.current);
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      boxShadow="lg"
      overflow="hidden"
      transition="all 0.3s"
      position="relative"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: '2xl'
      }}
    >
      {isRecommended && (
        <Badge
          position="absolute"
          top={2}
          left={2}
          colorScheme="brand"
          fontSize="xs"
          px={2}
          py={1}
          borderRadius="full"
          zIndex={1}
        >
          ⭐ Recomendado
        </Badge>
      )}
      {/* Image Container with 16:9 Aspect Ratio */}
      <Box
        position="relative"
        paddingTop="56.25%" // 16:9 aspect ratio
        overflow="hidden"
        bg="gray.100"
      >
        {product.image ? (
          <Image
            src={getImageUrl(product.image)}
            alt={product.name}
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            objectFit="cover"
            loading="lazy"
            transition="transform 0.3s"
            _hover={{ transform: 'scale(1.08)' }}
          />
        ) : (
          <Center position="absolute" top="0" left="0" w="100%" h="100%" bg="brand.50">
            <Text fontSize="2xl" fontWeight="600" color="brand.600">Sem Imagem</Text>
          </Center>
        )}

        {/* Category Badge */}
        {product.category?.name && (
          <Badge
            position="absolute"
            top={3}
            right={3}
            px={3}
            py={1}
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.95)"
            backdropFilter="blur(8px)"
            color="brand.700"
            fontSize="xs"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            boxShadow="sm"
          >
            {product.category.name}
          </Badge>
        )}
      </Box>

      {/* Content */}
      <Box p={5}>
        <VStack align="stretch" spacing={3}>
          <Heading size="md" color="gray.800" lineHeight="1.3" minH="2.6em" noOfLines={2}>
            {product.name}
          </Heading>

          {product.description && (
            <Text fontSize="sm" color="gray.600" lineHeight="1.5" noOfLines={2} minH="3em">
              {product.description}
            </Text>
          )}

          <Flex justify="space-between" align="center" mt={2}>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500" fontWeight="500">
                Preço
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="brand.600" lineHeight="1">
                R$ {product.price?.toFixed(2)}
              </Text>
            </VStack>

            <Button
              ref={buttonRef}
              colorScheme="brand"
              size="lg"
              onClick={handleAdd}
              isLoading={isAdding}
              loadingText=""
              px={6}
              minH="48px"
              minW="48px"
              borderRadius="full"
              boxShadow="md"
              fontSize="md"
              fontWeight="600"
              _hover={{
                transform: 'scale(1.05)',
                boxShadow: 'lg',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              transition="all 0.2s"
            >
              Adicionar
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default Menu;
