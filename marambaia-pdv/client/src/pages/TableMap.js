// src/pages/TableMap.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Heading,
  HStack,
  Flex,
  Text,
  Badge,
  Button,
  useDisclosure,
  useToast,
  IconButton,
  Select,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Input,
  Stat,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { FiPlus, FiRefreshCw, FiGrid, FiList, FiSearch } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

// Modals
import TableFormModal from "../components/Tables/TableFormModal";
import OpenTableModal from "../components/Tables/OpenTableModal";
import CloseTableModal from "../components/Tables/CloseTableModal";
import TransferTableModal from "../components/Tables/TransferTableModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AssignWaiterModal from "../components/Tables/AssignWaiterModal";
import QRCodeModal from "../components/Tables/QRCodeModal";

// Components
import TableCard from "../components/Tables/TableCard";
import TableListItem from "../components/Tables/TableListItem";
import LoadingOverlay from "../components/ui/LoadingOverlay";

// Socket
import { io } from "socket.io-client";

const TableMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");

  // State
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState("all");
  const [socket, setSocket] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Modals
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const {
    isOpen: isOpenTableOpen,
    onOpen: onOpenTableOpen,
    onClose: onOpenTableClose,
  } = useDisclosure();

  const {
    isOpen: isCloseTableOpen,
    onOpen: onCloseTableOpen,
    onClose: onCloseTableClose,
  } = useDisclosure();

  const {
    isOpen: isTransferTableOpen,
    onOpen: onTransferTableOpen,
    onClose: onTransferTableClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Estado para o modal de atribuição de garçom
  const [isAssignWaiterOpen, setIsAssignWaiterOpen] = useState(false);
  const onAssignWaiterOpen = () => setIsAssignWaiterOpen(true);
  const onAssignWaiterClose = () => setIsAssignWaiterOpen(false);

  // Estado para o modal de QR Code
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const onQRCodeOpen = () => setIsQRCodeOpen(true);
  const onQRCodeClose = () => setIsQRCodeOpen(false);

  // Load tables
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      console.log(
        "TableMap: Fetching tables data at",
        new Date().toLocaleTimeString()
      );
      const response = await api.get("/tables");
      if (response.data.success) {
        setTables(response.data.tables);

        // Calculate total revenue
        const total = response.data.tables.reduce((sum, table) => {
          return sum + (table.currentOrder?.total || 0);
        }, 0);
        console.log("TableMap: Setting total revenue to", total);
        setTotalRevenue(total);
      }
    } catch (error) {
      console.error("Erro ao carregar mesas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mesas",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initialize Socket.io
  useEffect(() => {
    // Set up socket
    const socketUrl = process.env.REACT_APP_SOCKET_URL ||
                      (process.env.REACT_APP_API_URL?.replace("/api", "")) ||
                      "http://localhost:3001";
    console.log("TableMap: Connecting to socket at", socketUrl);

    const socketInstance = io(socketUrl);
    setSocket(socketInstance);

    // Join the tables room
    socketInstance.emit("joinTableRoom");

    // Listen for table updates
    socketInstance.on("tableUpdate", ({ tableId, timestamp }) => {
      console.log(
        "TableMap: Table update received for table:",
        tableId,
        "at",
        new Date(timestamp).toLocaleTimeString()
      );
      fetchTables();
    });

    // Listen for data updates
    socketInstance.on("dataUpdate", ({ timestamp }) => {
      console.log(
        "TableMap: Data update received at",
        new Date(timestamp).toLocaleTimeString()
      );
      fetchTables();
    });

    // Cleanup when unmounting
    return () => {
      console.log("TableMap: Cleaning up socket connections");
      socketInstance.off("tableUpdate");
      socketInstance.off("dataUpdate");
      socketInstance.disconnect();
    };
  }, [fetchTables]);

  // Load tables when component mounts
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Open table modal
  const handleOpenTable = (table) => {
    setSelectedTable(table);
    onOpenTableOpen();
  };

  // Close table
  const handleCloseTable = (table) => {
    setSelectedTable(table);
    onCloseTableOpen();
  };

  // Transfer table
  const handleTransferTable = (table) => {
    setSelectedTable(table);
    onTransferTableOpen();
  };

  // View order details
  const handleViewOrder = (table) => {
    if (table.currentOrder && typeof table.currentOrder === "string") {
      navigate(`/orders/${table.currentOrder}`);
    } else if (table.currentOrder && table.currentOrder._id) {
      navigate(`/orders/${table.currentOrder._id}`);
    } else {
      toast({
        title: "Sem pedido",
        description: "Esta mesa não possui um pedido em aberto",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Open delete dialog
  const handleDeleteTable = (table) => {
    if (table.status !== "free") {
      toast({
        title: "Mesa ocupada",
        description: "Não é possível excluir uma mesa ocupada",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedTable(table);
    onDeleteOpen();
  };

  // Confirm table deletion
  const confirmDeleteTable = async () => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/tables/${selectedTable._id}`);

      if (response.data.success) {
        toast({
          title: "Mesa excluída",
          description: `Mesa ${selectedTable.number} excluída com sucesso`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        fetchTables();
        onDeleteClose();
      }
    } catch (error) {
      console.error("Erro ao excluir mesa:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao excluir mesa",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler para atribuir garçom a uma mesa
  const handleAssignWaiter = (table) => {
    setSelectedTable(table);
    onAssignWaiterOpen();
  };

  // Handler para exibir QR Code
  const handleQRCode = (table) => {
    setSelectedTable(table);
    onQRCodeOpen();
  };

  // Filter tables by status
  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.number
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || table.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort tables
  const sortedTables = [...filteredTables].sort((a, b) => {
    // Sort by number (assuming it's numeric)
    const numA = parseInt(a.number);
    const numB = parseInt(b.number);
    return isNaN(numA) || isNaN(numB)
      ? a.number.localeCompare(b.number)
      : numA - numB;
  });

  const isAdmin = user?.role === "admin" || user?.role === "manager";
  const isWaiter = user?.role === "waiter";

  return (
    <Box>
      {/* Header */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        mb={6}
        flexDirection={{ base: "column", md: "row" }}
        gap={4}
      >
        <Box>
          <Heading size="lg">Mesas</Heading>
          <Text color="gray.500">Gerenciamento de mesas e pedidos</Text>
        </Box>

        <Stat textAlign="right">
          <StatLabel>Total em Aberto</StatLabel>
          <StatNumber>R$ {totalRevenue.toFixed(2)}</StatNumber>
        </Stat>
      </Flex>

      <Flex mb={6} gap={4} flexDirection={{ base: "column", md: "row" }}>
        <InputGroup maxW={{ base: "100%", md: "320px" }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <HStack spacing={2}>
          {/* Status filter */}
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="sm"
            maxW="200px"
          >
            <option value="all">Todas as mesas</option>
            <option value="free">Livres</option>
            <option value="occupied">Ocupadas</option>
            <option value="waiting_payment">Aguardando pagamento</option>
          </Select>

          {/* View buttons */}
          <IconButton
            icon={<FiGrid />}
            aria-label="Visualização em grade"
            variant={viewMode === "grid" ? "solid" : "outline"}
            colorScheme="blue"
            onClick={() => setViewMode("grid")}
            size="sm"
          />
          <IconButton
            icon={<FiList />}
            aria-label="Visualização em lista"
            variant={viewMode === "list" ? "solid" : "outline"}
            colorScheme="blue"
            onClick={() => setViewMode("list")}
            size="sm"
          />

          {/* Reload */}
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar"
            onClick={fetchTables}
            isLoading={loading}
            size="sm"
          />

          {/* Add table (admin only) */}
          {isAdmin && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={onCreateOpen}
              size="sm"
            >
              Nova Mesa
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Tables List/Grid */}
      {loading ? (
        <LoadingOverlay />
      ) : (
        <>
          {/* Legend */}
          <Flex mb={4} gap={4} wrap="wrap">
            <HStack>
              <Badge colorScheme="green" p={1} borderRadius="md">
                Livre
              </Badge>
              <Text fontSize="sm">Mesa disponível</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="yellow" p={1} borderRadius="md">
                Ocupada
              </Badge>
              <Text fontSize="sm">Mesa com clientes</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="red" p={1} borderRadius="md">
                Pagamento
              </Badge>
              <Text fontSize="sm">Aguardando pagamento</Text>
            </HStack>
          </Flex>

          {viewMode === "grid" ? (
            <Grid
              templateColumns={{
                base: "repeat(1, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
                xl: "repeat(5, 1fr)",
              }}
              gap={4}
            >
              {sortedTables.map((table) => (
                <TableCard
                  key={table._id}
                  table={table}
                  onOpen={() => handleOpenTable(table)}
                  onClose={() => handleCloseTable(table)}
                  onTransfer={() => handleTransferTable(table)}
                  onViewOrder={() => handleViewOrder(table)}
                  onDelete={() => handleDeleteTable(table)}
                  onAssignWaiter={() => handleAssignWaiter(table)}
                  onQRCode={() => handleQRCode(table)}
                  isWaiter={isWaiter}
                  isAdmin={isAdmin}
                />
              ))}
            </Grid>
          ) : (
            <Box
              borderRadius="md"
              overflow="hidden"
              boxShadow="sm"
              bg={bgColor}
            >
              {sortedTables.map((table) => (
                <TableListItem
                  key={table._id}
                  table={table}
                  onOpen={() => handleOpenTable(table)}
                  onClose={() => handleCloseTable(table)}
                  onTransfer={() => handleTransferTable(table)}
                  onViewOrder={() => handleViewOrder(table)}
                  onDelete={() => handleDeleteTable(table)}
                  onAssignWaiter={() => handleAssignWaiter(table)}
                  isWaiter={isWaiter}
                  isAdmin={isAdmin}
                />
              ))}

              {sortedTables.length === 0 && (
                <Box p={4} textAlign="center">
                  <Text color="gray.500">Nenhuma mesa encontrada</Text>
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      {/* Modals */}
      <TableFormModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={fetchTables}
      />

      <OpenTableModal
        isOpen={isOpenTableOpen}
        onClose={onOpenTableClose}
        table={selectedTable}
        onSuccess={fetchTables}
      />

      <CloseTableModal
        isOpen={isCloseTableOpen}
        onClose={onCloseTableClose}
        table={selectedTable}
        onSuccess={fetchTables}
      />

      <TransferTableModal
        isOpen={isTransferTableOpen}
        onClose={onTransferTableClose}
        table={selectedTable}
        tables={tables.filter((t) => t.status === "free")}
        onSuccess={fetchTables}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={confirmDeleteTable}
        title="Excluir Mesa"
        message={`Tem certeza que deseja excluir a mesa ${selectedTable?.number}? Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />

      <AssignWaiterModal
        isOpen={isAssignWaiterOpen}
        onClose={onAssignWaiterClose}
        table={selectedTable}
        onSuccess={fetchTables}
      />

      <QRCodeModal
        isOpen={isQRCodeOpen}
        onClose={onQRCodeClose}
        table={selectedTable}
      />
    </Box>
  );
};

export default TableMap;
