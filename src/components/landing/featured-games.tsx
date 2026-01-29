"use client";

import { Box, Button, Container, Grid, Heading, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";

// Mock data
const games = [
    {
        id: 1,
        name: "Valorant",
        image: "https://images.unsplash.com/photo-1624138784181-2999e930a237?q=80&w=600&auto=format&fit=crop",
        category: "PC Game",
    },
    {
        id: 2,
        name: "Genshin Impact",
        image: "https://images.unsplash.com/photo-1630713815150-2c847025c1d9?q=80&w=600&auto=format&fit=crop",
        category: "Mobile/PC",
    },
    {
        id: 3,
        name: "Free Fire",
        image: "https://images.unsplash.com/photo-1623164285623-22f254929878?q=80&w=600&auto=format&fit=crop",
        category: "Mobile Game",
    },
    {
        id: 4,
        name: "ROV / AOV",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
        category: "Mobile Game",
    },
];

export function FeaturedGames() {
    return (
        <Box py={20}>
            <Container maxW="container.xl">
                <Stack gap={12}>
                    <Stack direction="row" justify="space-between" align="center">
                        <Heading size="3xl">Popular Games</Heading>
                        <Link href="/products">
                            <Button variant="ghost">View All</Button>
                        </Link>
                    </Stack>

                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
                        {games.map((game) => (
                            <Stack key={game.id} gap={0} borderRadius="xl" overflow="hidden" bg="bg.panel" boxShadow="sm" transition="transform 0.2s" _hover={{ transform: "translateY(-4px)" }}>
                                <Box position="relative" aspectRatio="16/9">
                                    <Image
                                        src={game.image}
                                        alt={game.name}
                                        objectFit="cover"
                                        width="full"
                                        height="full"
                                    />
                                </Box>
                                <Stack p={4} gap={3}>
                                    <Box>
                                        <Text fontSize="sm" color="blue.500" fontWeight="medium">{game.category}</Text>
                                        <Heading size="md">{game.name}</Heading>
                                    </Box>
                                    <Link href={`/products/${game.id}`} style={{ width: "100%" }}>
                                        <Button width="full" variant="surface">Top Up Now</Button>
                                    </Link>
                                </Stack>
                            </Stack>
                        ))}
                    </Grid>
                </Stack>
            </Container>
        </Box>
    );
}
