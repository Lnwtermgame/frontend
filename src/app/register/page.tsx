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

interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

export default function RegisterPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    const validateForm = () => {
        const newErrors: FormErrors = {};

        if (!username) {
            newErrors.username = "Username is required";
        } else if (username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        }

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

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
            await api.post("/auth/register", { username, email, password });

            toaster.create({
                title: "Registration successful",
                description: "Please sign in with your new account",
                type: "success",
            });

            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (error: any) {
            const message = error.response?.data?.message || "Registration failed";
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
                    <Heading size="2xl">Create Account</Heading>
                    <Text color="fg.muted">Join us to start topping up your games</Text>
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
                                label="Username"
                                invalid={!!errors.username}
                                errorText={errors.username}
                            >
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Choose a username"
                                    autoComplete="username"
                                />
                            </Field>

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
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                />
                            </Field>

                            <Field
                                label="Confirm Password"
                                invalid={!!errors.confirmPassword}
                                errorText={errors.confirmPassword}
                            >
                                <PasswordInput
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                />
                            </Field>

                            <Button
                                type="submit"
                                loading={isLoading}
                                width="full"
                                mt={4}
                                colorPalette="blue"
                            >
                                Sign Up
                            </Button>
                        </Stack>
                    </form>
                </Box>

                <Text textAlign="center">
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "var(--chakra-colors-blue-500)" }}>
                        Sign in
                    </Link>
                </Text>
            </VStack>
        </Container>
    );
}
