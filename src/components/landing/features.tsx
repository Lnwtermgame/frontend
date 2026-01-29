"use client";

import { Box, Container, Grid, Heading, Icon, Stack, Text } from "@chakra-ui/react";
import { LuZap, LuShieldCheck, LuHeadphones, LuTag } from "react-icons/lu";

const features = [
    {
        icon: LuZap,
        title: "Instant Delivery",
        description: "Receive your game credits or codes immediately after payment confirmation.",
    },
    {
        icon: LuShieldCheck,
        title: "Secure Payment",
        description: "We use industry-standard encryption to ensure your transactions are safe.",
    },
    {
        icon: LuHeadphones,
        title: "24/7 Support",
        description: "Our dedicated support team is always ready to assist you with any issues.",
    },
    {
        icon: LuTag,
        title: "Best Prices",
        description: "Enjoy competitive prices and regular promotions on your favorite games.",
    },
];

export function Features() {
    return (
        <Box py={20} bg="bg.subtle">
            <Container maxW="container.xl">
                <Stack gap={12}>
                    <Stack textAlign="center" gap={4}>
                        <Heading size="3xl">Why Choose Us?</Heading>
                        <Text fontSize="lg" color="fg.muted">
                            We provide the best experience for gamers worldwide
                        </Text>
                    </Stack>

                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={8}>
                        {features.map((feature, index) => (
                            <Stack key={index} bg="bg.panel" p={6} borderRadius="xl" boxShadow="sm" gap={4}>
                                <Box
                                    p={3}
                                    bg="blue.500"
                                    color="white"
                                    borderRadius="lg"
                                    width="fit-content"
                                >
                                    <Icon as={feature.icon} boxSize={6} />
                                </Box>
                                <Heading size="md">{feature.title}</Heading>
                                <Text color="fg.muted">{feature.description}</Text>
                            </Stack>
                        ))}
                    </Grid>
                </Stack>
            </Container>
        </Box>
    );
}
