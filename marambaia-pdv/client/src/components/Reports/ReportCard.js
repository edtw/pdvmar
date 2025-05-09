// src/components/Reports/ReportCard.js - FIXED
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

const ReportCard = ({ 
  title, 
  value, 
  helpText, 
  suffix = '', 
  icon,
  colorScheme = 'blue'
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const iconBgColor = useColorModeValue(`${colorScheme}.100`, `${colorScheme}.800`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.200`);
  
  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      boxShadow="sm"
      p={4}
      position="relative"
      overflow="hidden"
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel color="gray.500" fontSize="sm">{title}</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold">
            {value} {suffix && <Box as="span" fontSize="md">{suffix}</Box>}
          </StatNumber>
          {helpText && (
            <StatHelpText>{helpText}</StatHelpText>
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