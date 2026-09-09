"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

/** Runs once per hard load: warms the access token via cookie refresh. */
export function AuthBootstrap() {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);
  return null;
}
