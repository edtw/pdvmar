// components/SkeletonCard.js
import React from 'react';
import {
  Box,
  VStack,
  Flex,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';

export const ProductCardSkeleton = () => {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="md"
    >
      {/* Image Skeleton */}
      <Skeleton
        height="180px"
        startColor="gray.100"
        endColor="gray.300"
        speed={0.8}
      />

      <Box p={5}>
        <VStack align="stretch" spacing={3}>
          {/* Title Skeleton */}
          <SkeletonText
            noOfLines={2}
            spacing={2}
            skeletonHeight={4}
            startColor="gray.100"
            endColor="gray.200"
          />

          {/* Description Skeleton */}
          <SkeletonText
            noOfLines={2}
            spacing={2}
            skeletonHeight={3}
            startColor="gray.50"
            endColor="gray.150"
          />

          <Flex justify="space-between" align="center" mt={2}>
            {/* Price Skeleton */}
            <Skeleton height="32px" width="80px" borderRadius="md" />

            {/* Button Skeleton */}
            <Skeleton height="48px" width="120px" borderRadius="full" />
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default ProductCardSkeleton;
