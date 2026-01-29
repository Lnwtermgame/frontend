"use client";

import { Box, Button, Container, Flex, HStack, Heading, Link as ChakraLink } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster";

import { useAuth } from "@/context/auth-context";

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const isLoggedIn = !!user;

    const handleLogout = () => {
        logout();
    };

    return (
        <Box borderBottomWidth="1px" bg="bg.panel" position="sticky" top="0" zIndex="sticky">
            <Container maxW="container.xl">
                <Flex h="16" alignItems="center" justifyContent="space-between">
                    {/* Logo */}
                    <Link href="/">
                        <Heading size="lg" color="blue.500">GameTopUp</Heading>
                    </Link>

                    {/* Navigation */}
                    <HStack gap={8} display={{ base: "none", md: "flex" }}>
                        <Link href="/products">
                            <Button variant="ghost">Products</Button>
                        </Link>
                        {/* Add more nav links here */}
                    </HStack>

                    {/* Right Side Actions */}
                    <HStack gap={4}>
                        <ColorModeButton />

                        {isLoggedIn ? (
                            <HStack gap={4}>
                                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                                    {user?.username || "User"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </HStack>
                        ) : (
                            <HStack gap={2}>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">Login</Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm">Sign Up</Button>
                                </Link>
                            </HStack>
                        )}
                    </HStack>
                </Flex>
            </Container>
        </Box>
    );
}
