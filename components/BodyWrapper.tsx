"use client";

import { LanguageProvider } from "@/components/LanguageProvider";
import OfflineScreen, { useIsOnline } from "@/components/OfflineScreen";
import type { ReactNode } from "react";

export function BodyWrapper({ children }: { children: ReactNode }) {
  const online = useIsOnline();
  return (
    <LanguageProvider>
      {!online && <OfflineScreen />}
      {children}
    </LanguageProvider>
  );
}
