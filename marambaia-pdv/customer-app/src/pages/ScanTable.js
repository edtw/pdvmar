// pages/ScanTable.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Image
} from '@chakra-ui/react';
import { publicAPI } from '../services/api';

const ScanTable = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState(null);

  useEffect(() => {
    loadTableData();
    // eslint-disable-next-line
  }, [token]);

  const loadTableData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await publicAPI.getTableByToken(token);
      const { table } = response.data;

      setTableData(table);

      // Check if table status
      if (table.status === 'occupied' && table.currentOrder?.orderType === 'waiter') {
        // Table is occupied by waiter
        setError('Esta mesa está sendo atendida por um garçom. Solicite ajuda ao garçom.');
      }
      // If table has customer order, user must verify CPF when creating command
      // Don't auto-redirect - they need to verify CPF first for security

      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar mesa:', err);
      setError(err.response?.data?.message || 'Erro ao carregar mesa');
      setLoading(false);
    }
  };

  const handleCreateCommand = () => {
    navigate('/create-command', { state: { token, tableData } });
  };

  if (loading) {
    return (
      <Container maxW="container.sm" py={10}>
        <VStack spacing={6}>
          <Spinner size="xl" color="brand.500" />
          <Text>Carregando...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.sm" py={10}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" color="brand.600" mb={2}>
            Bem-vindo!
          </Heading>
          <Text fontSize="2xl" fontWeight="bold" color="gray.700">
            Mesa {tableData?.number}
          </Text>
        </Box>

        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="md"
          textAlign="center"
        >
          <VStack spacing={6}>
            <Text fontSize="4xl">🍴</Text>

            <Text fontSize="lg" color="gray.600">
              Crie sua comanda para começar a fazer pedidos!
            </Text>

            <Button
              colorScheme="brand"
              size="lg"
              width="full"
              onClick={handleCreateCommand}
            >
              Criar Comanda
            </Button>
          </VStack>
        </Box>

        <Text fontSize="sm" color="gray.500" textAlign="center">
          Escaneie o QR Code da mesa para começar
        </Text>
      </VStack>
    </Container>
  );
};

export default ScanTable;
