"use client";

import React, { type ComponentType, type PropsWithChildren } from "react";

/**
 * Compose multiple React context providers into a single wrapper.
 *
 * Eliminates deep nesting in layout.tsx by turning:
 *   <A><B><C>{children}</C></B></A>
 * Into:
 *   <ComposeProviders providers={[A, B, C]}>{children}</ComposeProviders>
 *
 * @example
 *   <ComposeProviders providers={[AuthProvider, CartProvider, ThemeProvider]}>
 *     <App />
 *   </ComposeProviders>
 */
export function ComposeProviders({
    providers,
    children,
}: {
    providers: ComponentType<PropsWithChildren>[];
    children: React.ReactNode;
}) {
    return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        children,
    );
}
