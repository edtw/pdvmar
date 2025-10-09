// pages/LandingPage.js - Beach-themed Landing Page
import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Heading, Text, VStack, Button, HStack, Grid, SimpleGrid, Link } from '@chakra-ui/react';
import './LandingPage.css';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroParallax = scrollY * 0.5;

  return (
    <Box className="landing-page beach-theme" bg="#0A2540" color="white" overflow="hidden">
      {/* Hero Section - Beach Parallax */}
      <Box
        ref={heroRef}
        className="hero-section"
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
      >
        {/* Beach Background Image with Parallax */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundImage="url(/images/praia2.jpg)"
          backgroundSize="cover"
          backgroundPosition="center"
          style={{
            transform: `translateY(${heroParallax}px)`,
          }}
        />

        {/* Gradient Overlay */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="linear-gradient(180deg, rgba(10, 37, 64, 0.3) 0%, rgba(10, 37, 64, 0.8) 100%)"
        />

        {/* Wave Animation Overlay */}
        <Box className="wave-overlay" position="absolute" bottom={0} left={0} right={0}>
          <svg className="waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
            <defs>
              <path id="wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g className="wave-parallax">
              <use href="#wave" x="48" y="0" fill="rgba(8, 145, 178, 0.3)" />
              <use href="#wave" x="48" y="3" fill="rgba(8, 145, 178, 0.5)" />
              <use href="#wave" x="48" y="5" fill="rgba(8, 145, 178, 0.7)" />
              <use href="#wave" x="48" y="7" fill="#0891B2" />
            </g>
          </svg>
        </Box>

        <Container maxW="container.lg" position="relative" zIndex={2}>
          <VStack spacing={8} textAlign="center">
            <Box className="fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Heading
                fontSize={{ base: '3.5rem', md: '6rem', lg: '7rem' }}
                fontWeight="800"
                letterSpacing="-0.04em"
                lineHeight="0.95"
                textShadow="0 4px 20px rgba(0, 0, 0, 0.6)"
              >
                Marambaia
              </Heading>
            </Box>

            <Box className="fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Text
                fontSize={{ base: '1.5rem', md: '2rem' }}
                fontWeight="400"
                letterSpacing="0.02em"
                opacity={0.95}
                textShadow="0 2px 10px rgba(0, 0, 0, 0.6)"
              >
                Restaurante à Beira-Mar
              </Text>
            </Box>

            <Box className="fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Text
                fontSize={{ base: '1.125rem', md: '1.375rem' }}
                maxW="700px"
                lineHeight="1.8"
                opacity={0.9}
                fontWeight="300"
                textShadow="0 2px 8px rgba(0, 0, 0, 0.6)"
              >
                Frutos do mar frescos com vista privilegiada para o mar.
                <br />
                Uma experiência gastronômica única em Barra de Guaratiba.
              </Text>
            </Box>

            {/* Scroll Indicator */}
            <Box className="scroll-indicator fade-in-up" style={{ animationDelay: '1s' }}>
              <Box className="mouse">
                <Box className="wheel" />
              </Box>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* About Section */}
      <Box py={{ base: 20, md: 32 }} bg="rgba(245, 222, 179, 0.05)" position="relative">
        <Container maxW="container.lg">
          <VStack spacing={8} maxW="900px" mx="auto" align="center">
            <Heading
              fontSize={{ base: '2.5rem', md: '4rem' }}
              fontWeight="700"
              letterSpacing="-0.02em"
              bgGradient="linear(to-r, #F5DEB3, #87CEEB)"
              bgClip="text"
              textAlign="center"
            >
              Nossa História
            </Heading>
            <Text
              fontSize={{ base: '1.125rem', md: '1.25rem' }}
              lineHeight="1.9"
              opacity={0.9}
              fontWeight="300"
              textAlign="center"
            >
              Localizado em Barra de Guaratiba, o Marambaia Beach oferece uma experiência
              gastronômica única à beira-mar, especializado em frutos do mar frescos e pratos
              tradicionais. Cada prato é cuidadosamente preparado com ingredientes locais de
              primeira qualidade, enquanto você desfruta de uma vista espetacular da praia.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Beach Gallery with 3D Tilt */}
      <Box py={{ base: 20, md: 32 }} position="relative">
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading
              fontSize={{ base: '2.5rem', md: '4rem' }}
              fontWeight="700"
              letterSpacing="-0.02em"
              textAlign="center"
              w="full"
            >
              Vista Privilegiada
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
              <BeachPhotoCard
                image="/images/praia.jpg"
                title="Barra de Guaratiba"
                description="Ponte icônica com vista para o mar"
                scrollY={scrollY}
                delay={0}
              />
              <BeachPhotoCard
                image="/images/praia2.jpg"
                title="Praia Paradisíaca"
                description="Areias brancas e águas cristalinas"
                scrollY={scrollY}
                delay={100}
              />
              <BeachPhotoCard
                image="/images/praia3.jpg"
                title="Frente ao Mar"
                description="Vista do nosso restaurante à beira-mar"
                scrollY={scrollY}
                delay={200}
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Location Section */}
      <Box bg="rgba(8, 145, 178, 0.1)" py={{ base: 20, md: 32 }} position="relative">
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <Heading
              fontSize={{ base: '2.5rem', md: '4rem' }}
              fontWeight="700"
              letterSpacing="-0.02em"
              textAlign="center"
              w="full"
            >
              Localização
            </Heading>

            <Grid
              templateColumns={{ base: '1fr', md: '1fr 1fr' }}
              gap={12}
              w="full"
              alignItems="start"
            >
              <VStack align="flex-start" spacing={8} w="full">
                <Box w="full">
                  <Heading size="md" mb={4} color="#F5DEB3">
                    Endereço
                  </Heading>
                  <VStack align="flex-start" spacing={2}>
                    <Text fontSize="md" opacity={0.9}>Estrada da Barra de Guaratiba, 9338</Text>
                    <Text fontSize="md" opacity={0.9}>Barra de Guaratiba</Text>
                    <Text fontSize="md" opacity={0.9}>Rio de Janeiro - RJ</Text>
                  </VStack>
                </Box>

                <Box w="full">
                  <Heading size="md" mb={4} color="#F5DEB3">
                    Horário de Funcionamento
                  </Heading>
                  <VStack align="flex-start" spacing={2}>
                    <Text fontSize="md" opacity={0.9}>Segunda: 10h - 21h</Text>
                    <Text fontSize="md" opacity={0.9}>Terça: Fechado</Text>
                    <Text fontSize="md" opacity={0.9}>Quarta a Sexta: 10h - 21h</Text>
                    <Text fontSize="md" opacity={0.9}>Sábado: 10h - 23h</Text>
                    <Text fontSize="md" opacity={0.9}>Domingo: 10h - 22h</Text>
                  </VStack>
                </Box>

                <Box w="full">
                  <Heading size="md" mb={4} color="#F5DEB3">
                    Contato
                  </Heading>
                  <VStack align="flex-start" spacing={2}>
                    <Text fontSize="md" opacity={0.9}>(21) 98888-3553</Text>
                    <Text fontSize="md" opacity={0.9}>(21) 96918-1992</Text>
                    <Text fontSize="md" opacity={0.9}>@marambaiabeach.rj</Text>
                  </VStack>
                </Box>
              </VStack>

              <Box
                w="full"
                h={{ base: '300px', md: '400px' }}
                borderRadius="2xl"
                overflow="hidden"
                border="1px solid rgba(255, 255, 255, 0.2)"
                boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
              >
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.0!2d-43.57!3d-23.05!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDAzJzAwLjAiUyA0M8KwMzQnMTIuMCJX!5e0!3m2!1spt-BR!2sbr!4v1620000000000!5m2!1spt-BR!2sbr"
                  allowFullScreen
                  title="Localização Marambaia Beach"
                />
              </Box>
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* Experience Section */}
      <Box py={{ base: 20, md: 32 }} position="relative">
        <Container maxW="container.lg">
          <VStack spacing={8} align="center">
            <Heading
              fontSize={{ base: '2.5rem', md: '4rem' }}
              fontWeight="700"
              letterSpacing="-0.02em"
              textAlign="center"
              maxW="800px"
            >
              Viva a Experiência Marambaia
            </Heading>
            <Text
              fontSize={{ base: '1.125rem', md: '1.5rem' }}
              opacity={0.8}
              maxW="600px"
              textAlign="center"
            >
              Reserve sua mesa e desfrute de momentos inesquecíveis à beira-mar.
            </Text>
            <Box mt={4}>
              <Button
                size="lg"
                height="60px"
                px={10}
                fontSize="lg"
                fontWeight="600"
                bg="rgba(245, 222, 179, 0.2)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(245, 222, 179, 0.4)"
                color="white"
                borderRadius="full"
                _hover={{
                  bg: 'rgba(245, 222, 179, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 20px 40px rgba(245, 222, 179, 0.3)',
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                Fazer Reserva
              </Button>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        py={12}
        borderTop="1px solid rgba(255, 255, 255, 0.1)"
        bg="rgba(0, 0, 0, 0.3)"
      >
        <Container maxW="container.lg">
          <VStack spacing={6}>
            <HStack spacing={8}>
              <Link
                href="https://www.instagram.com/marambaiabeach.rj/"
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
                opacity={0.7}
                _hover={{ opacity: 1 }}
              >
                Instagram
              </Link>
              <Link
                href="https://wa.me/5521988883553"
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
                opacity={0.7}
                _hover={{ opacity: 1 }}
              >
                WhatsApp
              </Link>
              <Link
                href="https://marambaiabeachpraia.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
                opacity={0.7}
                _hover={{ opacity: 1 }}
              >
                Site Oficial
              </Link>
            </HStack>
            <Text fontSize="sm" opacity={0.6} textAlign="center">
              © 2025 Marambaia Beach. Todos os direitos reservados.
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

// Beach Photo Card with 3D Tilt Effect
const BeachPhotoCard = ({ image, title, description, scrollY, delay }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -15;
    setMousePosition({ x, y });
  };

  const parallaxY = (scrollY - delay - 1000) * 0.05;

  return (
    <VStack
      spacing={4}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${mousePosition.y}deg) scale(1.05) translateY(${parallaxY}px)`
          : `perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1) translateY(${parallaxY}px)`,
        transition: 'transform 0.3s ease-out',
      }}
    >
      <Box
        w="full"
        h={{ base: '280px', md: '350px' }}
        borderRadius="2xl"
        overflow="hidden"
        position="relative"
        boxShadow={
          isHovered
            ? '0 30px 60px rgba(8, 145, 178, 0.4)'
            : '0 15px 30px rgba(0, 0, 0, 0.3)'
        }
        transition="box-shadow 0.3s ease"
      >
        <Box
          backgroundImage={`url(${image})`}
          backgroundSize="cover"
          backgroundPosition="center"
          w="full"
          h="full"
          style={{
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.6s ease-out',
          }}
        />

        {/* Gradient Overlay on Hover */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="linear-gradient(180deg, transparent 0%, rgba(8, 145, 178, 0.8) 100%)"
          opacity={isHovered ? 1 : 0}
          transition="opacity 0.3s ease"
          display="flex"
          alignItems="flex-end"
          p={6}
        >
          <VStack align="flex-start" spacing={2}>
            <Heading size="md" color="white">
              {title}
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.900">
              {description}
            </Text>
          </VStack>
        </Box>
      </Box>
    </VStack>
  );
};

export default LandingPage;
