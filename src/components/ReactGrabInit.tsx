"use client";

import { useEffect } from "react";

export function ReactGrabInit() {
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            import("react-grab");
        }
    }, []);

    return null;
}
