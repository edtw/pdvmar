// src/pages/Login.js
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Alert,
  AlertIcon,
  Image,
  useColorModeValue
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Redirecionar se já estiver autenticado
  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" />;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!username || !password) {
      setError('Preencha todos os campos');
      return;
    }
    
    setLoggingIn(true);
    setError('');
    
    try {
      const result = await login(username, password);
      
      if (!result.success) {
        setError(result.message || 'Erro ao fazer login');
      }
    } catch (error) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoggingIn(false);
    }
  };
  
  return (
    <Flex
      minHeight="100vh"
      width="full"
      align="center"
      justifyContent="center"
      bgGradient="linear(to-b, beach.ocean, beach.seafoam)"
    >
      <Box
        borderWidth={1}
        px={8}
        py={8}
        width="full"
        maxWidth="500px"
        borderRadius={8}
        boxShadow="lg"
        bg={bgColor}
      >
        <Box textAlign="center" mb={8}>
          <Image 
            src="/logo.png" 
            alt="Marambaia Beach RJ" 
            fallbackSrc="https://via.placeholder.com/150?text=Marambaia+Beach"
            maxH="120px"
            mx="auto"
            mb={4}
          />
          <Heading>Sistema PDV</Heading>
          <Text color="gray.500">Marambaia Beach RJ</Text>
        </Box>
        
        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <FormControl id="username" mb={4}>
            <FormLabel>Usuário</FormLabel>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu nome de usuário"
              disabled={loggingIn}
            />
          </FormControl>
          
          <FormControl id="password" mb={6}>
            <FormLabel>Senha</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loggingIn}
            />
          </FormControl>
          
          <Button
            width="full"
            colorScheme="blue"
            type="submit"
            isLoading={loggingIn}
            loadingText="Entrando"
            bg="beach.ocean"
            _hover={{ bg: "blue.600" }}
          >
            Entrar
          </Button>
        </form>
      </Box>
    </Flex>
  );
};

export default Login;