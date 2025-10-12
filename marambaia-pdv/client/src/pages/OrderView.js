// src/pages/OrderView.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  IconButton,
  Badge,
  Divider,
  HStack,
  VStack,
  useDisclosure,
  useToast,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import {
  FiPlus,
  FiRefreshCw,
  FiArrowLeft,
  FiPrinter,
  FiEdit,
  FiTrash2,
  FiClock,
  FiMoreVertical,
  FiCheck,
  FiCoffee,
  FiShoppingBag,
  FiInfo,
  FiDollarSign,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatDistanceStrict, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componentes
import LoadingOverlay from "../components/ui/LoadingOverlay";
import EmptyState from "../components/ui/EmptyState";
import OrderItem from "../components/Orders/OrderItem";
import AddItemModal from "../components/Orders/AddItemModal";

// Socket
import { io } from "socket.io-client";

const OrderView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");

  // Responsividade
  const isMobile = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: "md", md: "sm" });
  const fontSize = useBreakpointValue({ base: "sm", md: "md" });
  const headingSize = useBreakpointValue({ base: "md", md: "lg" });
  const tabsOrientation = useBreakpointValue({
    base: "vertical",
    md: "horizontal",
  });

  // Estado
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);

  // Modais
  const {
    isOpen: isAddItemOpen,
    onOpen: onAddItemOpen,
    onClose: onAddItemClose,
  } = useDisclosure();

  // Verificar se o usuário é garçom
  const isWaiter = user?.role === "waiter";

  // Carregar pedido e itens
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);

      if (!id || id === "[object Object]") {
        throw new Error("ID de pedido inválido");
      }
      // Buscar items do pedido
      const itemsResponse = await api.get(`/orders/${id}/items`);
      if (itemsResponse.data.success) {
        setItems(itemsResponse.data.items);
        setOrder(itemsResponse.data.order);

        // Buscar mesa
        if (itemsResponse.data.order.table) {
          const tableResponse = await api.get(
            `/tables/${itemsResponse.data.order.table}`
          );
          if (tableResponse.data.success) {
            setTable(tableResponse.data.table);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o pedido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  // Inicializar Socket.io
  useEffect(() => {
    // Configurar socket
    const socketUrl = process.env.REACT_APP_SOCKET_URL ||
                      (process.env.REACT_APP_API_URL?.replace("/api", "")) ||
                      "http://localhost:3001";
    const socketInstance = io(socketUrl);
    setSocket(socketInstance);

    // Entrar na sala do pedido
    socketInstance.emit("joinSpecificTable", order?.table);

    // Ouvir atualizações do pedido
    socketInstance.on("orderUpdate", ({ orderId, status }) => {
      console.log("Atualização de pedido recebida:", orderId, status);
      if (orderId === id) {
        fetchOrder();
      }
    });

    // Limpeza ao desmontar componente
    return () => {
      socketInstance.off("orderUpdate");
      socketInstance.disconnect();
    };
  }, [fetchOrder, id, order?.table]);

  // Carregar pedido ao montar componente
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Agrupar itens por status
  const itemsByStatus = {
    pending: items.filter((item) => item.status === "pending"),
    preparing: items.filter((item) => item.status === "preparing"),
    ready: items.filter((item) => item.status === "ready"),
    delivered: items.filter((item) => item.status === "delivered"),
    canceled: items.filter((item) => item.status === "canceled"),
  };

  // Atualizar status do item
  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      const response = await api.put(`/orders/items/${itemId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        toast({
          title: "Status atualizado",
          description: "Status do item atualizado com sucesso",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        // Atualizar localmente
        setItems((prevItems) =>
          prevItems.map((item) =>
            item._id === itemId ? { ...item, status: newStatus } : item
          )
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Remover item
  const handleRemoveItem = async (itemId) => {
    try {
      const response = await api.delete(`/orders/items/${itemId}`);

      if (response.data.success) {
        toast({
          title: "Item removido",
          description: "Item removido com sucesso",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        // Atualizar localmente
        setItems((prevItems) =>
          prevItems.filter((item) => item._id !== itemId)
        );

        // Atualizar pedido (total)
        fetchOrder();
      }
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Imprimir pedido/comanda
  const handlePrintOrder = () => {
    toast({
      title: "Impressão",
      description: "Funcionalidade de impressão em desenvolvimento",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Abrir resumo do pedido (versão móvel)
  const toggleOrderSummary = () => {
    setIsOrderSummaryOpen(!isOrderSummaryOpen);
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!order) {
    return (
      <EmptyState
        title="Pedido não encontrado"
        description="O pedido que você está procurando não existe ou foi removido"
        button={{
          text: "Voltar para Mesas",
          onClick: () => navigate("/tables"),
        }}
      />
    );
  }

  // Renderizar resumo do pedido
  const OrderSummary = () => (
    <Box bg={bgColor} borderRadius="md" boxShadow="sm" p={4}>
      <Heading size={isMobile ? "sm" : "md"} mb={4}>
        Resumo do Pedido
      </Heading>

      {/* Informações da mesa */}
      <VStack align="stretch" spacing={2} mb={4}>
        <HStack justify="space-between">
          <Text fontWeight="medium">Mesa</Text>
          <Text>{table?.number || "-"}</Text>
        </HStack>

        <HStack justify="space-between">
          <Text fontWeight="medium">Garçom</Text>
          <Text>{order.waiter?.name || "-"}</Text>
        </HStack>

        <HStack justify="space-between">
          <Text fontWeight="medium">Abertura</Text>
          <Text>
            {table?.openTime
              ? format(new Date(table.openTime), "dd/MM/yy HH:mm")
              : "-"}
          </Text>
        </HStack>

        <HStack justify="space-between">
          <Text fontWeight="medium">Status</Text>
          <Badge colorScheme={order.status === "open" ? "green" : "gray"}>
            {order.status === "open" ? "Aberto" : "Fechado"}
          </Badge>
        </HStack>
      </VStack>

      <Divider my={4} />

      {/* Resumo financeiro */}
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text>Subtotal</Text>
          <Text>{formatCurrency(order.total || 0)}</Text>
        </HStack>

        <HStack justify="space-between">
          <Text>Taxa de serviço (10%)</Text>
          <Text>{formatCurrency(order.total * 0.1 || 0)}</Text>
        </HStack>

        <Divider />

        <HStack justify="space-between" fontWeight="bold">
          <Text>Total</Text>
          <Text>{formatCurrency(order.total * 1.1 || 0)}</Text>
        </HStack>
      </VStack>

      {/* Botões de ação */}
      {order.status === "open" && (
        <VStack mt={6} spacing={3}>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            w="full"
            onClick={onAddItemOpen}
            size={buttonSize}
          >
            Adicionar Item
          </Button>

          <Button
            leftIcon={<FiArrowLeft />}
            colorScheme="green"
            variant="outline"
            w="full"
            onClick={() => navigate(`/tables`)}
            size={buttonSize}
          >
            Voltar para Mesas
          </Button>
        </VStack>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Cabeçalho */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        flexDirection={{ base: "column", md: "row" }}
        gap={2}
      >
        <HStack>
          <IconButton
            icon={<FiArrowLeft />}
            aria-label="Voltar"
            variant="ghost"
            onClick={() => navigate("/tables")}
            size={buttonSize}
          />
          <Box>
            <Heading size={headingSize}>Pedido da Mesa {table?.number}</Heading>
            <Text color="gray.500" fontSize={fontSize}>
              {order.status === "open"
                ? "Em andamento"
                : order.status === "closed"
                ? "Finalizado"
                : "Cancelado"}
              {order.status === "open" &&
                table?.openTime &&
                ` • ${formatDistanceStrict(
                  new Date(table.openTime),
                  new Date(),
                  { locale: ptBR }
                )}`}
            </Text>
          </Box>
        </HStack>

        <HStack>
          {/* Para mobile: botão de resumo */}
          {isMobile && (
            <IconButton
              icon={<FiInfo />}
              aria-label="Ver resumo"
              onClick={toggleOrderSummary}
              colorScheme="blue"
              size={buttonSize}
            />
          )}

          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar"
            onClick={fetchOrder}
            size={buttonSize}
          />

          {!isMobile && (
            <IconButton
              icon={<FiPrinter />}
              aria-label="Imprimir comanda"
              onClick={handlePrintOrder}
              size={buttonSize}
            />
          )}

          {order.status === "open" && !isMobile && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={onAddItemOpen}
              size={buttonSize}
            >
              Adicionar Item
            </Button>
          )}

          {/* Botão de adicionar para mobile */}
          {order.status === "open" && isMobile && (
            <IconButton
              icon={<FiPlus />}
              colorScheme="blue"
              onClick={onAddItemOpen}
              aria-label="Adicionar item"
              size={buttonSize}
            />
          )}
        </HStack>
      </Flex>

      {/* Conteúdo principal - Layout responsivo */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={4}>
        {/* Painel principal - Items */}
        <Box>
          <Tabs
            variant="enclosed"
            colorScheme="blue"
            orientation={isMobile ? "horizontal" : "horizontal"}
            isFitted={isMobile}
          >
            <TabList
              overflowX={isMobile ? "auto" : "visible"}
              overflowY="hidden"
              py={1}
              css={{
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              <Tab whiteSpace="nowrap" minW={isMobile ? "100px" : "auto"}>
                Todos ({items.length})
              </Tab>
              {itemsByStatus.pending.length > 0 && (
                <Tab whiteSpace="nowrap" minW={isMobile ? "100px" : "auto"}>
                  Pendentes ({itemsByStatus.pending.length})
                </Tab>
              )}
              {itemsByStatus.preparing.length > 0 && (
                <Tab whiteSpace="nowrap" minW={isMobile ? "100px" : "auto"}>
                  Preparando ({itemsByStatus.preparing.length})
                </Tab>
              )}
              {itemsByStatus.ready.length > 0 && (
                <Tab whiteSpace="nowrap" minW={isMobile ? "100px" : "auto"}>
                  Prontos ({itemsByStatus.ready.length})
                </Tab>
              )}
              {itemsByStatus.delivered.length > 0 && (
                <Tab whiteSpace="nowrap" minW={isMobile ? "100px" : "auto"}>
                  Entregues ({itemsByStatus.delivered.length})
                </Tab>
              )}
              {itemsByStatus.canceled.length > 0 && (
                <Tab whiteSpace="nowrap" minW={isMobile ? "100px" : "auto"}>
                  Cancelados ({itemsByStatus.canceled.length})
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {/* Todos os items */}
              <TabPanel p={isMobile ? 2 : 4}>
                <VStack spacing={3} align="stretch">
                  {items.length === 0 ? (
                    <Box textAlign="center" py={6}>
                      <Text color="gray.500">
                        Nenhum item adicionado ao pedido
                      </Text>
                      {order.status === "open" && (
                        <Button
                          mt={4}
                          leftIcon={<FiPlus />}
                          onClick={onAddItemOpen}
                          size={buttonSize}
                        >
                          Adicionar Item
                        </Button>
                      )}
                    </Box>
                  ) : (
                    items.map((item) => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                        isMobile={isMobile}
                      />
                    ))
                  )}
                </VStack>
              </TabPanel>

              {/* Pendentes */}
              {itemsByStatus.pending.length > 0 && (
                <TabPanel p={isMobile ? 2 : 4}>
                  <VStack spacing={3} align="stretch">
                    {itemsByStatus.pending.map((item) => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                        isMobile={isMobile}
                      />
                    ))}
                  </VStack>
                </TabPanel>
              )}

              {/* Preparando */}
              {itemsByStatus.preparing.length > 0 && (
                <TabPanel p={isMobile ? 2 : 4}>
                  <VStack spacing={3} align="stretch">
                    {itemsByStatus.preparing.map((item) => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                        isMobile={isMobile}
                      />
                    ))}
                  </VStack>
                </TabPanel>
              )}

              {/* Prontos */}
              {itemsByStatus.ready.length > 0 && (
                <TabPanel p={isMobile ? 2 : 4}>
                  <VStack spacing={3} align="stretch">
                    {itemsByStatus.ready.map((item) => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                        isMobile={isMobile}
                      />
                    ))}
                  </VStack>
                </TabPanel>
              )}

              {/* Entregues */}
              {itemsByStatus.delivered.length > 0 && (
                <TabPanel p={isMobile ? 2 : 4}>
                  <VStack spacing={3} align="stretch">
                    {itemsByStatus.delivered.map((item) => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                        isMobile={isMobile}
                      />
                    ))}
                  </VStack>
                </TabPanel>
              )}

              {/* Cancelados */}
              {itemsByStatus.canceled.length > 0 && (
                <TabPanel p={isMobile ? 2 : 4}>
                  <VStack spacing={3} align="stretch">
                    {itemsByStatus.canceled.map((item) => (
                      <OrderItem
                        key={item._id}
                        item={item}
                        orderStatus={order.status}
                        onStatusChange={handleUpdateItemStatus}
                        onRemove={handleRemoveItem}
                        userRole={user.role}
                        isMobile={isMobile}
                      />
                    ))}
                  </VStack>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </Box>

        {/* Painel lateral - Resumo (apenas para desktop) */}
        {!isMobile && (
          <Box>
            <OrderSummary />
          </Box>
        )}
      </Grid>

      {/* Drawer para resumo do pedido em dispositivos móveis */}
      {isMobile && (
        <Drawer
          isOpen={isOrderSummaryOpen}
          placement="bottom"
          onClose={() => setIsOrderSummaryOpen(false)}
          size="md"
        >
          <DrawerOverlay />
          <DrawerContent borderTopRadius="md">
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">
              Resumo do Pedido
            </DrawerHeader>
            <DrawerBody p={4}>
              <OrderSummary />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      {/* Modais */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={onAddItemClose}
        orderId={id}
        onSuccess={fetchOrder}
      />

      {/* Botão flutuante para adicionar item em dispositivos móveis */}
      {isMobile && order.status === "open" && (
        <Button
          position="fixed"
          bottom="20px"
          right="20px"
          colorScheme="blue"
          borderRadius="full"
          width="60px"
          height="60px"
          onClick={onAddItemOpen}
          zIndex={3}
          p={0}
        >
          <FiPlus size={24} />
        </Button>
      )}
    </Box>
  );
};

export default OrderView;
