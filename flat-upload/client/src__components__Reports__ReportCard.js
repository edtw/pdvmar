// src/components/Reports/ReportCard.js
import React from 'react';
import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';

/**
 * Componente de cartão para exibição de estatísticas em relatórios
 * @param {string} title - Título do card
 * @param {string|number} value - Valor principal a ser exibido
 * @param {string} helpText - Texto auxiliar opcional
 * @param {string} suffix - Sufixo opcional (ex: "pedidos", "usuários")
 * @param {Component} icon - Ícone do React (FiIcon)
 * @param {string} colorScheme - Esquema de cores (blue, green, orange, etc)
 */
const ReportCard = ({ 
  title, 
  value, 
  helpText, 
  suffix = '', 
  icon,
  colorScheme = 'blue'
}) => {
  // Cores adaptativas para modo claro/escuro
  const bgColor = useColorModeValue('white', 'gray.800');
  const iconBgColor = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.800`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.200`);
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      boxShadow="sm"
      p={4}
      position="relative"
      overflow="hidden"
      borderWidth="1px"
      borderColor={borderColor}
      transition="all 0.3s"
      _hover={{ 
        boxShadow: "md",
        transform: "translateY(-2px)"
      }}
    >
      {/* Efeito de borda colorida */}
      <Box 
        position="absolute" 
        top="0" 
        left="0" 
        right="0" 
        height="4px" 
        bg={`${colorScheme}.500`} 
      />
      
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">{title}</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold">
            {value} {suffix && <Box as="span" fontSize="md">{suffix}</Box>}
          </StatNumber>
          {helpText && (
            <StatHelpText fontSize="xs" color="gray.500" marginTop="1">
              {helpText}
            </StatHelpText>
          )}
        </Stat>
        
        <Flex
          w="12"
          h="12"
          align="center"
          justify="center"
          borderRadius="full"
          bg={iconBgColor}
        >
          <Icon as={icon} boxSize="5" color={iconColor} />
        </Flex>
      </Flex>
    </Box>
  );
};

export default ReportCard;