// src/pages/Users.js
// Página independente para gerenciamento de usuários
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  useToast,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Drawer,
  Divider,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiSearch,
  FiMoreVertical,
  FiUserPlus,
  FiCheck,
  FiX,
  FiInfo,
  FiFilter,
  FiLock,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import UserFormModal from '../components/Users/UserFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import EmptyState from '../components/ui/EmptyState';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
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
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Carregar usuários
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  // Carregar ao montar o componente
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Filtrar usuários
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      !searchTerm || 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || u.role === roleFilter;
    
    const matchesStatus = 
      statusFilter === '' || 
      (statusFilter === 'active' && u.active) || 
      (statusFilter === 'inactive' && !u.active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // Editar usuário
  const handleEdit = (user) => {
    setSelectedUser(user);
    onEditOpen();
  };
  
  // Confirmar exclusão/desativação
  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    onDeleteOpen();
  };
  
  // Realizar exclusão/desativação
  const confirmToggleStatus = async () => {
    try {
      setLoading(true);
      
      const newStatus = !selectedUser.active;
      
      const response = await api.patch(`/auth/users/${selectedUser._id}/status`, {
        active: newStatus
      });
      
      if (response.data.success) {
        toast({
          title: newStatus ? 'Usuário Ativado' : 'Usuário Desativado',
          description: `${selectedUser.name} foi ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Atualizar lista
        fetchUsers();
        onDeleteClose();
      }
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao alterar status do usuário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir modal de reset de senha
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword(generateRandomPassword(8));
    setIsResetPasswordOpen(true);
  };
  
  // Gerar senha aleatória
  const generateRandomPassword = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  // Realizar reset de senha
  const confirmResetPassword = async () => {
    try {
      setIsResetting(true);
      
      const response = await api.post(`/auth/users/${selectedUser._id}/reset-password`, {
        password: newPassword
      });
      
      if (response.data.success) {
        toast({
          title: 'Senha redefinida',
          description: `A senha de ${selectedUser.name} foi alterada com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setIsResetPasswordOpen(false);
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao redefinir senha',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  // Obter texto do perfil
  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'waiter':
        return 'Garçom';
      case 'kitchen':
        return 'Cozinha';
      default:
        return 'Desconhecido';
    }
  };
  
  // Obter cor do perfil
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'purple';
      case 'manager':
        return 'blue';
      case 'waiter':
        return 'green';
      case 'kitchen':
        return 'orange';
      default:
        return 'gray';
    }
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
          <Heading size="lg">Usuários</Heading>
          <Text color="gray.500">Gerenciamento de usuários do sistema</Text>
        </Box>
        
        <Button
          leftIcon={<FiUserPlus />}
          colorScheme="blue"
          onClick={onCreateOpen}
        >
          Novo Usuário
        </Button>
      </Flex>
      
      {/* Alerta para usuários não admin */}
      {user.role !== 'admin' && (
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Acesso Limitado</AlertTitle>
            <AlertDescription>
              Apenas administradores podem gerenciar usuários com todas as permissões.
            </AlertDescription>
          </Box>
        </Alert>
      )}
      
      {/* Filtros */}
      <Flex 
        mb={6} 
        gap={4} 
        flexDirection={{ base: 'column', md: 'row' }}
      >
        <InputGroup maxW={{ base: "100%", md: "320px" }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input 
            placeholder="Buscar usuários..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        <HStack spacing={2} flexWrap={{ base: "wrap", md: "nowrap" }}>
          <Select 
            placeholder="Todos os papéis" 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            maxW="200px"
          >
            <option value="admin">Administradores</option>
            <option value="manager">Gerentes</option>
            <option value="waiter">Garçons</option>
            <option value="kitchen">Cozinha</option>
          </Select>
          
          <Select 
            placeholder="Todos os status" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="200px"
          >
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </Select>
          
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar"
            onClick={fetchUsers}
            isLoading={loading}
          />
        </HStack>
      </Flex>
      
      {/* Lista de usuários */}
      {loading ? (
        <LoadingOverlay />
      ) : filteredUsers.length > 0 ? (
        <Box 
          borderRadius="lg" 
          overflow="hidden" 
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
        >
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nome</Th>
                  <Th>Usuário</Th>
                  <Th>Perfil</Th>
                  <Th>Status</Th>
                  <Th width="100px">Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map(userItem => (
                  <Tr key={userItem._id}>
                    <Td fontWeight="medium">{userItem.name}</Td>
                    <Td>{userItem.username}</Td>
                    <Td>
                      <Badge colorScheme={getRoleColor(userItem.role)}>
                        {getRoleText(userItem.role)}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={userItem.active ? 'green' : 'red'}>
                        {userItem.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem 
                            icon={<FiEdit />} 
                            onClick={() => handleEdit(userItem)}
                          >
                            Editar
                          </MenuItem>
                          <MenuItem 
                            icon={<FiLock />} 
                            onClick={() => handleResetPassword(userItem)}
                          >
                            Redefinir Senha
                          </MenuItem>
                          {userItem._id !== user.id && (
                            <MenuItem 
                              icon={userItem.active ? <FiX /> : <FiCheck />} 
                              onClick={() => handleToggleStatus(userItem)}
                              color={userItem.active ? "red.500" : "green.500"}
                            >
                              {userItem.active ? 'Desativar' : 'Ativar'}
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      ) : (
        <EmptyState 
          title="Nenhum usuário encontrado"
          description={
            searchTerm || roleFilter || statusFilter
              ? "Tente ajustar os filtros de busca"
              : "Clique no botão 'Novo Usuário' para adicionar"
          }
          icon={FiFilter}
          button={
            !searchTerm && !roleFilter && !statusFilter
              ? {
                  text: 'Novo Usuário',
                  onClick: onCreateOpen
                }
              : undefined
          }
        />
      )}
      
      {/* Modais */}
      <UserFormModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={fetchUsers}
      />
      
      {selectedUser && (
        <>
          <UserFormModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            user={selectedUser}
            onSuccess={fetchUsers}
          />
          
          <ConfirmDialog
            isOpen={isDeleteOpen}
            onClose={onDeleteClose}
            onConfirm={confirmToggleStatus}
            title={selectedUser.active ? "Desativar Usuário" : "Ativar Usuário"}
            message={
              selectedUser.active
                ? `Tem certeza que deseja desativar o usuário "${selectedUser.name}"? Ele não poderá mais acessar o sistema.`
                : `Tem certeza que deseja ativar o usuário "${selectedUser.name}"? Ele poderá acessar o sistema novamente.`
            }
            confirmText={selectedUser.active ? "Desativar" : "Ativar"}
            colorScheme={selectedUser.active ? "red" : "green"}
          />
          
          <Drawer
            isOpen={isResetPasswordOpen}
            placement="right"
            onClose={() => setIsResetPasswordOpen(false)}
          >
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>Redefinir Senha</DrawerHeader>
              
              <DrawerBody>
                <Alert status="info" mb={4} borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Nova senha gerada</AlertTitle>
                    <AlertDescription>
                      Uma nova senha aleatória foi gerada para o usuário. 
                      Forneça esta senha ao usuário e peça que ele a altere no próximo acesso.
                    </AlertDescription>
                  </Box>
                </Alert>
                
                <Box 
                  p={4} 
                  bg="gray.50" 
                  borderRadius="md" 
                  borderWidth="1px" 
                  borderColor="gray.200"
                  mb={4}
                >
                  <Text fontWeight="medium" mb={2}>Usuário:</Text>
                  <Text>{selectedUser?.name}</Text>
                  <Text color="gray.500" fontSize="sm">{selectedUser?.username}</Text>
                  
                  <Divider my={4} />
                  
                  <Text fontWeight="medium" mb={2}>Nova Senha:</Text>
                  <Text 
                    fontSize="xl" 
                    fontFamily="monospace" 
                    letterSpacing="wider"
                    fontWeight="bold"
                  >
                    {newPassword}
                  </Text>
                </Box>
                
                <Text fontSize="sm" color="gray.500">
                  Esta senha não poderá ser recuperada após fechar esta janela. 
                  Certifique-se de copiá-la ou anotá-la antes de prosseguir.
                </Text>
              </DrawerBody>
              
              <DrawerFooter>
                <Button variant="outline" mr={3} onClick={() => setIsResetPasswordOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  colorScheme="blue" 
                  onClick={confirmResetPassword}
                  isLoading={isResetting}
                >
                  Confirmar Alteração
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </Box>
  );
};

export default Users;