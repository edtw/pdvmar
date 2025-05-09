import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Flex,
  IconButton,
  useDisclosure,
  useToast,
  Switch,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Center,
  Spinner
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiRefreshCw,
  FiSearch
} from 'react-icons/fi';
import api from '../services/api';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CategoryFormModal from '../components/Categories/CategoryFormModal';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Disclosure hooks para modais
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
  
  // Carregar categorias
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar ao montar o componente
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Editar categoria
  const handleEdit = (category) => {
    setSelectedCategory(category);
    onEditOpen();
  };
  
  // Confirmar exclusão
  const handleDelete = (category) => {
    setSelectedCategory(category);
    onDeleteOpen();
  };
  
  // Excluir categoria
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/categories/${selectedCategory._id}`);
      
      if (response.data.success) {
        toast({
          title: 'Categoria excluída',
          description: 'Categoria excluída com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Atualizar lista
        fetchCategories();
        onDeleteClose();
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir categoria',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Alternar disponibilidade da categoria
  const toggleActive = async (category) => {
    try {
      const response = await api.put(`/categories/${category._id}`, {
        ...category,
        active: !category.active
      });
      
      if (response.data.success) {
        toast({
          title: category.active ? 'Categoria desativada' : 'Categoria ativada',
          description: `A categoria foi ${category.active ? 'desativada' : 'ativada'} com sucesso`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        // Atualizar lista
        fetchCategories();
      }
    } catch (error) {
      console.error('Erro ao alterar status da categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da categoria',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Renderizar lista de categorias
  const renderCategories = () => {
    if (loading) {
      return (
        <Center h="200px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      );
    }
    
    if (categories.length === 0) {
      return (
        <Tr>
          <Td colSpan={5} textAlign="center" py={4}>
            <Text color="gray.500">Nenhuma categoria encontrada</Text>
            <Button
              mt={4}
              leftIcon={<FiPlus />}
              colorScheme="blue"
              size="sm"
              onClick={onCreateOpen}
            >
              Nova Categoria
            </Button>
          </Td>
        </Tr>
      );
    }
    
    return categories.map(category => (
      <Tr key={category._id}>
        <Td fontWeight="medium">{category.name}</Td>
        <Td>{category.description || '-'}</Td>
        <Td>
          <Badge colorScheme={category.active ? 'green' : 'red'}>
            {category.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </Td>
        <Td>{category.order || 0}</Td>
        <Td>
          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
            />
            <MenuList zIndex={10}>
              <MenuItem 
                icon={<FiEdit />} 
                onClick={() => handleEdit(category)}
              >
                Editar
              </MenuItem>
              <MenuItem 
                icon={category.active ? <FiTrash2 /> : <FiPlus />} 
                onClick={() => toggleActive(category)}
              >
                {category.active ? 'Desativar' : 'Ativar'}
              </MenuItem>
              <MenuItem 
                icon={<FiTrash2 />} 
                onClick={() => handleDelete(category)}
                color="red.500"
              >
                Excluir
              </MenuItem>
            </MenuList>
          </Menu>
        </Td>
      </Tr>
    ));
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
          <Heading size="lg">Categorias</Heading>
          <Text color="gray.500">Gerenciamento de categorias de produtos</Text>
        </Box>
        
        <Flex gap={2}>
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Atualizar"
            onClick={fetchCategories}
            isLoading={loading}
          />
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onCreateOpen}
          >
            Nova Categoria
          </Button>
        </Flex>
      </Flex>
      
      {/* Tabela de categorias */}
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Descrição</Th>
              <Th>Status</Th>
              <Th>Ordem</Th>
              <Th width="100px">Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {renderCategories()}
          </Tbody>
        </Table>
      </Box>
      
      {/* Modais */}
      <CategoryFormModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={fetchCategories}
      />
      
      {selectedCategory && (
        <CategoryFormModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          category={selectedCategory}
          onSuccess={fetchCategories}
        />
      )}
      
      {/* Confirmação de exclusão */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={confirmDelete}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir a categoria "${selectedCategory?.name}"? Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default Categories;