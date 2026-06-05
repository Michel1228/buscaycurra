"use client";

import { LanguageProvider } from "@/components/LanguageProvider";
import type { ReactNode } from "react";

export function BodyWrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
