"use client";

import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";

export function Hero() {
    return (
        <Box position="relative" overflow="hidden">
            {/* Background Gradient */}
            <Box
                position="absolute"
                top="-50%"
                left="-50%"
                right="-50%"
                bottom="-50%"
                bgGradient="radial(circle, blue.500 0%, transparent 60%)"
                opacity="0.1"
                pointerEvents="none"
            />

            <Container maxW="container.xl" py={{ base: 20, md: 32 }}>
                <Stack gap={8} align="center" textAlign="center" maxW="3xl" mx="auto">
                    <Heading
                        size={{ base: "4xl", md: "6xl" }}
                        fontWeight="bold"
                        lineHeight="1.1"
                        letterSpacing="tight"
                    >
                        Level Up Your Game{" "}
                        <Text as="span" color="blue.500">
                            Instantly
                        </Text>
                    </Heading>

                    <Text fontSize={{ base: "lg", md: "xl" }} color="fg.muted" maxW="2xl">
                        The fastest and most secure way to top up your favorite games.
                        Get instant delivery of game credits, gift cards, and more.
                    </Text>

                    <Stack direction={{ base: "column", sm: "row" }} gap={4}>
                        <Link href="/products">
                            <Button size="xl" colorPalette="blue">
                                Browse Games <LuArrowRight />
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="xl" variant="outline">
                                Create Account
                            </Button>
                        </Link>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}
