// src/components/Backup/BackupManager.js
import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react';
import BackupList from './BackupList';
import CreateBackupButton from './CreateBackupButton';
import RestoreBackupButton from './RestoreBackupButton';

const BackupManager = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const handleRefresh = () => {
    // Incrementar para forçar re-render
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="md" mb={2}>Backup do Sistema</Heading>
          <Text color="gray.500">
            Crie backups do banco de dados e gerencie restaurações
          </Text>
        </Box>
        
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Operações sensíveis</AlertTitle>
            <AlertDescription>
              As operações de backup e restauração lidam com todos os dados do sistema.
              Por favor, tenha cuidado ao restaurar backups.
            </AlertDescription>
          </Box>
        </Alert>
        
        <HStack spacing={4}>
          <CreateBackupButton onSuccess={handleRefresh} />
          <RestoreBackupButton />
        </HStack>
        
        <Divider />
        
        // src/components/Backup/BackupManager.js (continuação)
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Backups Anteriores</Tab>
            <Tab>Informações</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel px={0} py={4}>
              <BackupList 
                key={refreshTrigger} 
                onRefresh={handleRefresh} 
              />
            </TabPanel>
            
            <TabPanel>
              <Box
                p={5}
                bg={bgColor}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <Heading size="sm" mb={3}>Sobre Backups</Heading>
                
                <Text mb={2}>
                  <strong>O que é feito backup?</strong>
                </Text>
                <Text mb={4}>
                  O backup inclui todos os dados do sistema: usuários, mesas, produtos, categorias, 
                  pedidos, transações de caixa e configurações. Imagens e arquivos enviados não são 
                  incluídos no backup.
                </Text>
                
                <Text mb={2}>
                  <strong>Com que frequência fazer backup?</strong>
                </Text>
                <Text mb={4}>
                  Recomendamos fazer backup diariamente, preferencialmente em horários de menor movimento. 
                  Também é essencial fazer backup antes de atualizações ou manutenções no sistema.
                </Text>
                
                <Text mb={2}>
                  <strong>Restauração de backup</strong>
                </Text>
                <Text mb={4}>
                  Ao restaurar um backup, todos os dados atuais serão substituídos pelos dados do backup. 
                  Este processo não pode ser desfeito, então tenha certeza antes de iniciar uma restauração.
                </Text>
                
                <Text mb={2}>
                  <strong>Política de retenção</strong>
                </Text>
                <Text>
                  O sistema mantém automaticamente os 10 backups mais recentes. Backups mais antigos são 
                  excluídos para economizar espaço em disco.
                </Text>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default BackupManager;