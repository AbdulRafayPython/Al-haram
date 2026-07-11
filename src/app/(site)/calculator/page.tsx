import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";
import { getHotels } from "@/lib/data/hotels";
import { getVisas } from "@/lib/data/visas";

export const metadata: Metadata = {
  title: "Umrah Package Calculator",
  description:
    "Estimate your Umrah trip cost step by step — travelers, visa, Makkah and Madinah hotels — with a live total in SAR and PKR.",
};

export default async function CalculatorPage() {
  const [hotels, visas] = await Promise.all([getHotels(), getVisas()]);

  return (
    <>
      <PageHeader
        eyebrow="Plan Your Budget"
        title="Umrah Package Calculator"
        description="Build your estimate in five guided steps. Adjust travelers, visa, and hotels to see your total update live."
        icon="calculate"
        image="/images/madinah.jpg"
      />
      <section className="py-14 md:py-20">
        <Container>
          <CalculatorWizard hotels={hotels} visas={visas} />
        </Container>
      </section>
    </>
  );
}
