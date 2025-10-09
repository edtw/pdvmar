// pages/CreateCommand.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Button,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import { publicAPI } from '../services/api';

const CreateCommand = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const { token, tableData } = location.state || {};

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCPF = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({
      ...prev,
      cpf: formatted
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    // Validate CPF
    const cpfClean = formData.cpf.replace(/\D/g, '');
    if (!cpfClean || cpfClean.length !== 11) {
      setError('CPF é obrigatório e deve ter 11 dígitos');
      return;
    }

    if (!token) {
      setError('Token da mesa não encontrado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await publicAPI.createCommand({
        tableToken: token,
        name: formData.name.trim(),
        cpf: cpfClean,
        phone: formData.phone || null,
        email: formData.email || null
      });

      const { order, existingOrder } = response.data;

      // Store CPF in sessionStorage for future requests
      sessionStorage.setItem('customerCpf', cpfClean);

      if (existingOrder) {
        // Returning customer - show welcome back message
        toast({
          title: 'Bem-vindo de volta!',
          description: 'Seu pedido anterior foi recuperado.',
          status: 'info',
          duration: 3000,
          isClosable: true
        });
      }

      toast({
        title: 'Comanda criada!',
        description: 'Agora você pode fazer seus pedidos.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Navigate to menu
      navigate(`/menu/${order._id}`);
    } catch (err) {
      console.error('Erro ao criar comanda:', err);
      setError(err.response?.data?.message || 'Erro ao criar comanda');
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container maxW="container.sm" py={10}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Informações da mesa não encontradas. Por favor, escaneie o QR Code novamente.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" color="brand.600" mb={2}>
            Criar Comanda
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Mesa {tableData?.number}
          </Text>
        </Box>

        <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
          <form onSubmit={handleSubmit}>
            <VStack spacing={6}>
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  size="lg"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>CPF</FormLabel>
                <Input
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  size="lg"
                  maxLength={14}
                />
                <FormHelperText>
                  🔒 Obrigatório para segurança. Apenas você poderá acessar e modificar seu pedido.
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Telefone (opcional)</FormLabel>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>E-mail (opcional)</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  size="lg"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                width="full"
                isLoading={loading}
                loadingText="Criando..."
              >
                Criar Comanda
              </Button>
            </VStack>
          </form>
        </Box>

        <Text fontSize="sm" color="gray.500" textAlign="center">
          Ao criar a comanda, você concorda em fornecer essas informações para o estabelecimento.
        </Text>
      </VStack>
    </Container>
  );
};

export default CreateCommand;
