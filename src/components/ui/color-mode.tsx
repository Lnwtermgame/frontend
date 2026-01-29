"use client"

import type { IconButtonProps } from "@chakra-ui/react"
import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react"
import { ThemeProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import * as React from "react"
import { LuMoon, LuSun } from "react-icons/lu"

export interface ColorModeProviderProps extends ThemeProviderProps { }

export function ColorModeProvider(props: ColorModeProviderProps) {
    return (
        <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
    )
}

export function useColorMode() {
    const { resolvedTheme, setTheme } = useTheme()
    const toggleColorMode = () => {
        setTheme(resolvedTheme === "light" ? "dark" : "light")
    }
    return {
        colorMode: resolvedTheme,
        setColorMode: setTheme,
        toggleColorMode,
    }
}

export function ColorModeButton(props: IconButtonProps) {
    const { toggleColorMode, colorMode } = useColorMode()
    return (
        <ClientOnly fallback={<Skeleton boxSize="8" />}>
            <IconButton
                onClick={toggleColorMode}
                variant="ghost"
                aria-label="Toggle color mode"
                size="sm"
                {...props}
            >
                {colorMode === "light" ? <LuSun /> : <LuMoon />}
            </IconButton>
        </ClientOnly>
    )
}
