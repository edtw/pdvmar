// src/pages/Settings.js (atualizada com suporte a backup)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Flex,
  IconButton,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiMoreVertical,
  FiSave,
  FiUser,
  FiUsers,
  FiSettings,
  FiDatabase,
  FiPrinter
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import BackupManager from '../components/Backup/BackupManager'; // Novo componente

const Settings = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printers, setPrinters] = useState([]);
  const [settings, setSettings] = useState({
    includeServiceFee: true,
    printReceipt: false,
    enableNotifications: true,
    defaultPrinter: ''
  });
  
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const toast = useToast();
  
  // Carregar usuários
  const fetchUsers = async () => {
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
  };
  
  // Carregar impressoras disponíveis
  const fetchPrinters = async () => {
    try {
      // Placeholder para obter impressoras - na implementação real, você usaria uma API
      // Esta é apenas uma simulação
      setPrinters([
        { id: 'elgin-i9', name: 'ELGIN BEMATECH i9', default: true },
        { id: 'epson-tm20', name: 'EPSON TM-20', default: false }
      ]);
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error);
    }
  };
  
  // Carregar configurações
  const fetchSettings = async () => {
    try {
      // Placeholder para obter configurações - na implementação real, você usaria uma API
      // Esta é apenas uma simulação usando valores padrão
      setSettings({
        includeServiceFee: true,
        printReceipt: false,
        enableNotifications: true,
        defaultPrinter: 'elgin-i9'
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };
  
  // Carregar ao montar o componente
  useEffect(() => {
    fetchUsers();
    fetchPrinters();
    fetchSettings();
  }, []);
  
  // Confirmar exclusão
  const handleDelete = (user) => {
    setSelectedUser(user);
    onDeleteOpen();
  };
  
  // Atualizar configurações
  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Salvar configurações
  const handleSaveSettings = () => {
    // Na implementação real, você enviaria as configurações para o backend
    toast({
      title: 'Configurações salvas',
      description: 'As configurações foram salvas com sucesso',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Testar impressão
  const handleTestPrint = () => {
    toast({
      title: 'Teste de impressão',
      description: 'Enviando teste para a impressora ' + settings.defaultPrinter,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
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
          <Heading size="lg">Configurações</Heading>
          <Text color="gray.500">Gerenciamento do sistema</Text>
        </Box>
      </Flex>
      
      {/* Tabs de configurações */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab><FiUsers /> <Text ml={2}>Usuários</Text></Tab>
          <Tab><FiDatabase /> <Text ml={2}>Backup</Text></Tab>
          <Tab><FiPrinter /> <Text ml={2}>Impressora</Text></Tab>
          <Tab><FiSettings /> <Text ml={2}>Sistema</Text></Tab>
        </TabList>
        
        <TabPanels>
          {/* Aba de Usuários */}
          <TabPanel px={0}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Usuários do Sistema</Heading>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                size="sm"
                onClick={() => {/* Abrir modal de novo usuário */}}
              >
                Novo Usuário
              </Button>
            </Flex>
            
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
                  {users.map(userItem => (
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
                              onClick={() => {/* Editar usuário */}}
                            >
                              Editar
                            </MenuItem>
                            {userItem._id !== user.id && (
                              <MenuItem 
                                icon={<FiTrash2 />} 
                                onClick={() => handleDelete(userItem)}
                                color="red.500"
                              >
                                {userItem.active ? 'Desativar' : 'Ativar'}
                              </MenuItem>
                            )}
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                  
                  {users.length === 0 && (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={4}>
                        Nenhum usuário encontrado
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
          
          {/* Aba de Backup - Novo componente */}
          <TabPanel>
            <BackupManager />
          </TabPanel>
          
          {/* Aba de Impressora */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="md">Configuração de Impressora</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Impressora Padrão</FormLabel>
                      <Select
                        name="defaultPrinter"
                        value={settings.defaultPrinter}
                        onChange={handleSettingsChange}
                      >
                        {printers.map(printer => (
                          <option key={printer.id} value={printer.id}>
                            {printer.name} {printer.default ? ' (Padrão)' : ''}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="printReceipt" mb="0">
                        Imprimir comanda automaticamente
                      </FormLabel>
                      <Switch
                        id="printReceipt"
                        name="printReceipt"
                        isChecked={settings.printReceipt}
                        onChange={handleSettingsChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <HStack>
                      <Button 
                        onClick={handleTestPrint}
                        leftIcon={<FiPrinter />}
                        colorScheme="blue"
                        variant="outline"
                      >
                        Testar Impressão
                      </Button>
                      
                      <Button 
                        colorScheme="blue"
                        leftIcon={<FiSave />}
                        onClick={handleSaveSettings}
                      >
                        Salvar Configurações
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="md">Detalhes da Impressora</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontWeight="bold">Modelo:</Text>
                      <Text>ELGIN BEMATECH i9</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Interface:</Text>
                      <Text>USB</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Status:</Text>
                      <Badge colorScheme="green">Conectada</Badge>
                    </Box>
                    <Divider my={2} />
                    <Text fontSize="sm" color="gray.500">
                      Para adicionar ou remover impressoras, use o painel de controle do Windows.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
          
          {/* Aba de Sistema */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="md">Informações do Sistema</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Versão</Text>
                      <Text>1.0.0</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Banco de Dados</Text>
                      <Badge colorScheme="green">Conectado</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">API</Text>
                      <Badge colorScheme="green">Online</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Data de Instalação</Text>
                      <Text>29/04/2025</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
              
              <Divider />
              
              <Card>
                <CardHeader>
                  <Heading size="md">Configurações Gerais</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="includeServiceFee" mb="0">
                        Incluir taxa de serviço (10%)
                      </FormLabel>
                      <Switch
                        id="includeServiceFee"
                        name="includeServiceFee"
                        isChecked={settings.includeServiceFee}
                        onChange={handleSettingsChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="enableNotifications" mb="0">
                        Ativar notificações
                      </FormLabel>
                      <Switch
                        id="enableNotifications"
                        name="enableNotifications"
                        isChecked={settings.enableNotifications}
                        onChange={handleSettingsChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <Button 
                      colorScheme="blue"
                      leftIcon={<FiSave />}
                      alignSelf="flex-end"
                      onClick={handleSaveSettings}
                    >
                      Salvar Alterações
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Confirmação de exclusão/desativação */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={() => {/* Desativar usuário */}}
        title={selectedUser?.active ? "Desativar Usuário" : "Ativar Usuário"}
        message={`Tem certeza que deseja ${selectedUser?.active ? 'desativar' : 'ativar'} o usuário "${selectedUser?.name}"?`}
        confirmText={selectedUser?.active ? "Desativar" : "Ativar"}
        colorScheme={selectedUser?.active ? "red" : "green"}
      />
    </Box>
  );
};

export default Settings;