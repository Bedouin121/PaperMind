import { motion } from "motion/react";
import { Upload, MessageSquare, Sparkles } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Upload,
    title: "Drop your PDF",
    desc: "Up to 2000 pages. Drag in, paste a link, or sync from Drive.",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "We vectorize it",
    desc: "Semantic embeddings, OCR for scans, structure-aware chunking.",
  },
  {
    n: "03",
    icon: MessageSquare,
    title: "Ask anything",
    desc: "Summarize, extract, translate, compare — with sourced citations.",
  },
];

export function PdfFlow() {
  return (
    <section id="how" className="relative py-32 px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-20"
      >
        <div className="font-mono text-xs uppercase tracking-wider text-accent mb-4">
          // workflow
        </div>
        <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
          Three steps. <span className="text-gradient">Zero friction.</span>
        </h2>
      </motion.div>

      <div className="relative grid md:grid-cols-3 gap-8">
        {/* connecting line */}
        <div className="absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent hidden md:block" />

        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="relative text-center"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative mx-auto w-24 h-24 rounded-2xl glass shadow-glow flex items-center justify-center mb-6"
            >
              <s.icon className="w-10 h-10 text-primary" />
              <span className="absolute -top-2 -right-2 font-mono text-xs bg-aurora text-background rounded-full px-2 py-0.5 font-bold">
                {s.n}
              </span>
            </motion.div>
            <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
