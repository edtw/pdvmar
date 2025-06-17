// src/components/Users/UserFormModal.js
import React, { useState, useEffect } from 'react';
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
  Input,
  Select,
  FormHelperText,
  InputGroup,
  InputRightElement,
  IconButton,
  Switch,
  VStack,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../services/api';

const UserFormModal = ({ isOpen, onClose, user = null, onSuccess }) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'waiter',
    active: true
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const toast = useToast();
  
  // Preencher formulário se for edição
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '',
        confirmPassword: '',
        role: user.role || 'waiter',
        active: user.active !== undefined ? user.active : true
      });
    } else if (isOpen) {
      // Reset para novo usuário
      setFormData({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'waiter',
        active: true
      });
    }
    
    // Limpar erro quando o modal é aberto/fechado
    setError('');
  }, [user, isOpen]);
  
  // Alternar visibilidade da senha
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  // Alternar visibilidade da confirmação de senha
  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Manipular alterações nos campos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação de campos obrigatórios
    if (!formData.name || !formData.username || (!user && !formData.password)) {
      setError('Nome, usuário e senha são obrigatórios');
      return;
    }
    
    // Validar senha se for cadastro ou se a senha foi preenchida na edição
    if (!user || formData.password) {
      // Verificar comprimento mínimo da senha
      if (formData.password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres');
        return;
      }
      
      // Verificar se as senhas conferem
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não conferem');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      let response;
      const userData = { ...formData };
      
      // Remover confirmPassword do objeto a ser enviado
      delete userData.confirmPassword;
      
      // Se estiver editando e a senha estiver vazia, remover o campo para não atualizar
      if (user && !userData.password) {
        delete userData.password;
      }
      
      if (user) {
        // Atualizar usuário existente
        response = await api.put(`/auth/users/${user._id}`, userData);
      } else {
        // Criar novo usuário
        response = await api.post('/auth/register', userData);
      }
      
      if (response.data.success) {
        toast({
          title: user ? 'Usuário atualizado' : 'Usuário criado',
          description: user 
            ? `${formData.name} foi atualizado com sucesso` 
            : `${formData.name} foi criado com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Callback de sucesso
        if (onSuccess) onSuccess();
        
        // Fechar modal
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      
      // Extrair mensagem de erro da resposta, se disponível
      const errorMessage = error.response?.data?.message || 'Erro ao salvar usuário';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="md"
    >
      <ModalOverlay />
      <ModalContent borderRadius="lg">
        <ModalHeader>
          {user ? 'Editar Usuário' : 'Novo Usuário'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form id="user-form" onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Nome Completo</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome do usuário"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Nome de Usuário</FormLabel>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Login para acesso"
                />
                <FormHelperText>
                  O nome de usuário é utilizado para fazer login no sistema
                </FormHelperText>
              </FormControl>
              
              <FormControl isRequired={!user}>
                <FormLabel>{user ? 'Nova Senha (opcional)' : 'Senha'}</FormLabel>
                <InputGroup>
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={user ? "Deixe em branco para manter" : "Senha"}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={handleTogglePassword}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>
                  {user 
                    ? "Se não quiser alterar a senha, deixe este campo em branco"
                    : "A senha deve ter no mínimo 6 caracteres"}
                </FormHelperText>
              </FormControl>
              
              <FormControl isRequired={!user || !!formData.password}>
                <FormLabel>Confirmar Senha</FormLabel>
                <InputGroup>
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirme a senha"
                    isDisabled={user && !formData.password}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleConfirmPassword}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl>
                <FormLabel>Função</FormLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="admin">Administrador</option>
                  <option value="manager">Gerente</option>
                  <option value="waiter">Garçom</option>
                  <option value="kitchen">Cozinha</option>
                </Select>
                <FormHelperText>
                  Define as permissões de acesso do usuário no sistema
                </FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center" mt={2}>
                <FormLabel htmlFor="active" mb="0">
                  Usuário Ativo
                </FormLabel>
                <Switch
                  id="active"
                  name="active"
                  isChecked={formData.active}
                  onChange={handleChange}
                  colorScheme="green"
                />
                <FormHelperText ml={2}>
                  Usuários inativos não podem acessar o sistema
                </FormHelperText>
              </FormControl>
            </VStack>
          </form>
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            type="submit"
            form="user-form"
            isLoading={loading}
            loadingText="Salvando"
          >
            {user ? 'Atualizar' : 'Criar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserFormModal;