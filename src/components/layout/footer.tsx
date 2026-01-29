"use client";

import { Box, Container, Flex, Text, Link, Stack } from "@chakra-ui/react";

export function Footer() {
    return (
        <Box bg="bg.subtle" color="fg.muted" py={10} mt="auto">
            <Container maxW="container.xl">
                <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={4}>
                    <Text fontSize="sm">
                        &copy; {new Date().getFullYear()} GameTopUp. All rights reserved.
                    </Text>

                    <Stack direction="row" gap={6}>
                        <Link href="#" fontSize="sm">Privacy Policy</Link>
                        <Link href="#" fontSize="sm">Terms of Service</Link>
                        <Link href="#" fontSize="sm">Contact Us</Link>
                    </Stack>
                </Flex>
            </Container>
        </Box>
    );
}
