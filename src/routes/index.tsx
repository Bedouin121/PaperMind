import { createFileRoute } from "@tanstack/react-router";
import { PdfHero } from "@/components/PdfHero";
import { PdfFeatures } from "@/components/PdfFeatures";
import { PdfFlow } from "@/components/PdfFlow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PaperMind — Chat with any PDF, instantly" },
      {
        name: "description",
        content:
          "Drop a PDF, ask anything. Get cited answers grounded in your document in milliseconds.",
      },
      { property: "og:title", content: "PaperMind — Chat with any PDF" },
      {
        property: "og:description",
        content: "Turn any PDF into a conversation. Cited, instant, encrypted.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="bg-background text-foreground">
      <PdfHero />
      <PdfFeatures />
      <PdfFlow />
    </main>
  );
}
