// src/components/Backup/CreateBackupButton.js
import React, { useState } from 'react';
import {
  Button,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Text
} from '@chakra-ui/react';
import { FiDatabase } from 'react-icons/fi';
import api from '../../services/api';

const CreateBackupButton = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const cancelRef = React.useRef();
  const toast = useToast();
  
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  
  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/backups');
      
      if (response.data.success) {
        toast({
          title: 'Backup criado',
          description: 'O backup do sistema foi criado com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Fechar dialog
        handleClose();
        
        // Callback de sucesso
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao criar backup',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button
        leftIcon={<FiDatabase />}
        colorScheme="blue"
        onClick={handleOpen}
      >
        Fazer Backup
      </Button>
      
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Criar Backup do Sistema
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={4}>
                Você está prestes a criar um backup completo do banco de dados.
              </Text>
              <Text mb={2}>
                Esta operação:
              </Text>
              <Text as="ul" pl={5}>
                <Text as="li">Pode levar alguns minutos para concluir</Text>
                <Text as="li">Não afetará o funcionamento do sistema</Text>
                <Text as="li">Criará uma cópia completa dos dados atuais</Text>
              </Text>
              <Text mt={4}>
                Deseja prosseguir?
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleCreateBackup} 
                ml={3}
                isLoading={loading}
                loadingText="Criando backup..."
              >
                Criar Backup
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default CreateBackupButton;