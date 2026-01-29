"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
    Box,
    Button,
    Container,
    Heading,
    Input,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Toaster, toaster } from "@/components/ui/toaster";

export default function LoginPage() {
    const router = useRouter();
    const { login, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Invalid email address";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await api.post("/auth/login", { email, password });
            const { token, user: userData } = response.data.data;

            login(token, userData);

            toaster.create({
                title: "Login successful",
                type: "success",
            });

            router.push("/dashboard");
        } catch (error: any) {
            const message = error.response?.data?.message || "Login failed. Please check your credentials.";
            toaster.create({
                title: "Error",
                description: message,
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxW="md" py={10}>
            <Toaster />
            <VStack gap={8} align="stretch">
                <Stack gap={2} textAlign="center">
                    <Heading size="2xl">Welcome Back</Heading>
                    <Text color="fg.muted">Sign in to your account to continue</Text>
                </Stack>

                <Box
                    p={8}
                    borderWidth="1px"
                    borderRadius="lg"
                    boxShadow="sm"
                    bg="bg.panel"
                >
                    <form onSubmit={handleSubmit} method="POST">
                        <Stack gap={4}>
                            <Field
                                label="Email"
                                invalid={!!errors.email}
                                errorText={errors.email}
                            >
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                />
                            </Field>

                            <Field
                                label="Password"
                                invalid={!!errors.password}
                                errorText={errors.password}
                            >
                                <PasswordInput
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                            </Field>

                            <Button
                                type="submit"
                                loading={isLoading}
                                width="full"
                                mt={4}
                                colorPalette="blue"
                            >
                                Sign In
                            </Button>
                        </Stack>
                    </form>
                </Box>

                <Text textAlign="center">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" style={{ color: "var(--chakra-colors-blue-500)" }}>
                        Sign up
                    </Link>
                </Text>
            </VStack>
        </Container>
    );
}
