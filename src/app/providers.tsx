"use client";

import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { Grain } from "@/components/Grain";
import { ScrollManager } from "@/components/ScrollManager";
import { WhatsAppProvider } from "@/components/WhatsApp";

/**
 * Client provider tree — mirrors the original App.tsx wrapper
 * (BrowserRouter/Routes are replaced by the Next.js App Router).
 */
export function Providers({
  children,
  whatsappNumber,
  whatsappMessage,
}: {
  children: ReactNode;
  whatsappNumber?: string;
  whatsappMessage?: string;
}) {
  return (
    <SmoothScroll>
      <WhatsAppProvider number={whatsappNumber} message={whatsappMessage}>
        <ScrollManager />
        <Cursor />
        <Grain />
        {children}
      </WhatsAppProvider>
    </SmoothScroll>
  );
}
