import { createFileRoute } from "@tanstack/react-router";
import { PdfChat } from "@/components/PdfChat";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "PaperMind — Chat with your PDF" },
      { name: "description", content: "Upload a PDF and ask anything about it." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <PdfChat />
    </main>
  );
}
