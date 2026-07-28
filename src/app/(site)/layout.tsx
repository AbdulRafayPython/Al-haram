import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { FlashBannerSlot } from "@/components/layout/FlashBannerSlot";
import { Talbiyah } from "@/components/layout/Talbiyah";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Streamed so a banner lookup never delays the page shell. */}
      <Suspense fallback={null}>
        <FlashBannerSlot />
      </Suspense>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <Talbiyah />
    </>
  );
}
