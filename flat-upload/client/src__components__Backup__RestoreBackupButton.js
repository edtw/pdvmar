// src/components/Backup/RestoreBackupButton.js
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
  Text,
  Input,
  FormControl,
  FormLabel,
  Box
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

const RestoreBackupButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const cancelRef = React.useRef();
  const fileInputRef = React.useRef();
  const toast = useToast();
  
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setFileName('');
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };
  
  const handleClickFileInput = () => {
    fileInputRef.current.click();
  };
  
  const handleRestoreBackup = async () => {
    // Note: Esta implementação é um placeholder. Na prática, você teria que
    // criar uma rota específica para upload e restauração de arquivos de backup.
    // A implementação completa exigiria um endpoint que aceita upload multipart.
    
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A restauração por arquivo ainda não está disponível. Use a lista de backups para restaurar.',
      status: 'info',
      duration: 4000,
      isClosable: true,
    });
    
    handleClose();
  };
  
  return (
    <>
      <Button
        leftIcon={<FiUpload />}
        variant="outline"
        onClick={handleOpen}
      >
        Restaurar Backup
      </Button>
      
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Restaurar Backup do Sistema
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={4} color="red.500" fontWeight="bold">
                ATENÇÃO: Esta é uma operação perigosa!
              </Text>
              <Text mb={4}>
                Restaurar um backup irá substituir TODOS os dados atuais pelos dados do backup.
                Esta ação não pode ser desfeita.
              </Text>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".gz,.archive"
                style={{ display: 'none' }}
              />
              
              <FormControl mt={4}>
                <FormLabel>Arquivo de Backup</FormLabel>
                <Box 
                  display="flex" 
                  alignItems="center"
                  justifyContent="space-between"
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={2}
                >
                  <Text 
                    isTruncated 
                    color={fileName ? "black" : "gray.500"}
                    maxW="70%"
                  >
                    {fileName || "Nenhum arquivo selecionado"}
                  </Text>
                  <Button size="sm" onClick={handleClickFileInput}>
                    Selecionar
                  </Button>
                </Box>
              </FormControl>
              
              <Text mt={4} fontSize="sm">
                Recomendamos que você use a aba "Backups Anteriores" para restaurar um backup existente.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleRestoreBackup} 
                ml={3}
                isLoading={loading}
                loadingText="Restaurando..."
                isDisabled={!file}
              >
                Restaurar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default RestoreBackupButton;