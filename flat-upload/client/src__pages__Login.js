// src/pages/Login.js (melhorado)
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
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton,
  Stack,
  Center,
  useBreakpointValue,
  VStack
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardShadow = useColorModeValue('xl', 'dark-lg');
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.400, beach.ocean)',
    'linear(to-b, gray.900, gray.800)'
  );
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const imageSide = useBreakpointValue({ base: false, lg: true });
  const mobileImage = useBreakpointValue({ base: true, md: false });
  
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
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Flex minH="100vh" width="full" align="center" justifyContent="center">
        <Box
          maxW="1200px"
          w={{ base: "95%", md: "90%", lg: "80%" }}
          mx="auto"
          overflow="hidden"
          borderRadius="xl"
          boxShadow={cardShadow}
          bg={bgColor}
        >
          <Flex direction={{ base: 'column', lg: 'row' }}>
            {/* Imagem lateral (apenas desktop) */}
            {imageSide && (
              <Box 
                bgImage="url('/beach.jpg')" 
                bgSize="cover" 
                bgPosition="center"
                flex={1}
                position="relative"
              >
                <Box 
                  position="absolute" 
                  top={0} 
                  left={0} 
                  right={0} 
                  bottom={0} 
                  bg="rgba(0, 119, 190, 0.5)"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  p={10}
                  textAlign="center"
                >
                  <Heading color="white" size="xl" mb={6}>
                    Bem-vindo ao PDV<br/>Marambaia Beach
                  </Heading>
                  <Text color="white" fontSize="lg">
                    Sistema completo para gerenciamento do seu negócio
                  </Text>
                </Box>
              </Box>
            )}
            
            {/* Formulário */}
            <Box flex={1} p={{ base: 8, md: 12 }}>
              <VStack spacing={6} align="center" mb={8}>
                {/* Logo para mobile */}
                {mobileImage && (
                  <Center mb={3}>
                    <Image 
                      src="/logo.png" 
                      alt="Marambaia Beach RJ" 
                      fallbackSrc="https://via.placeholder.com/150?text=Marambaia+Beach"
                      maxH="100px"
                    />
                  </Center>
                )}
                
                <Heading textAlign="center">Login</Heading>
                <Text color="gray.500" textAlign="center">
                  Entre com suas credenciais para acessar o sistema
                </Text>
              </VStack>
              
              {error && (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit}>
                <Stack spacing={5}>
                  <FormControl id="username">
                    <FormLabel>Usuário</FormLabel>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Digite seu nome de usuário"
                      disabled={loggingIn}
                      size="lg"
                      variant="filled"
                      _focus={{ borderColor: "beach.ocean" }}
                    />
                  </FormControl>
                  
                  <FormControl id="password">
                    <FormLabel>Senha</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        disabled={loggingIn}
                        size="lg"
                        variant="filled"
                        _focus={{ borderColor: "beach.ocean" }}
                      />
                      <InputRightElement h="full">
                        <IconButton
                          variant="ghost"
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          icon={showPassword ? <FiEyeOff /> : <FiEye />}
                          onClick={toggleShowPassword}
                          size="sm"
                          colorScheme="blue"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                  
                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    isLoading={loggingIn}
                    loadingText="Entrando"
                    bg="beach.ocean"
                    _hover={{ bg: "blue.600" }}
                    leftIcon={<FiLogIn />}
                    mt={4}
                    w="full"
                  >
                    Entrar
                  </Button>
                </Stack>
              </form>
              
              <Text fontSize="sm" color="gray.500" mt={10} textAlign="center">
                © {new Date().getFullYear()} Marambaia Beach RJ - Todos os direitos reservados
              </Text>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default Login;