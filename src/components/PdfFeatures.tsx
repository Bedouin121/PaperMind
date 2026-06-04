import { motion } from "motion/react";
import { Brain, Zap, Quote, Lock, Languages, Search } from "lucide-react";

const features = [
  { icon: Brain, title: "Deep reasoning", desc: "Multi-step inference across hundreds of pages." },
  { icon: Quote, title: "Cited answers", desc: "Every claim links back to the exact passage." },
  { icon: Zap, title: "Instant indexing", desc: "1000-page docs ready in under 10 seconds." },
  { icon: Languages, title: "95+ languages", desc: "Ask in one language, get answers in another." },
  { icon: Search, title: "Semantic search", desc: "Find concepts, not just keywords." },
  { icon: Lock, title: "End-to-end encrypted", desc: "Your PDF never leaves your vault." },
];

export function PdfFeatures() {
  return (
    <section id="features" className="relative py-32 px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-16"
      >
        <div className="font-mono text-xs uppercase tracking-wider text-primary mb-4">
          // capabilities
        </div>
        <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
          Built like a <span className="text-gradient">research assistant</span>.
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className="group relative glass rounded-2xl p-6 hover:shadow-neon transition-all overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-aurora opacity-0 group-hover:opacity-20 blur-2xl transition-opacity" />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center mb-4 group-hover:bg-aurora transition-colors">
                <f.icon className="w-5 h-5 text-primary group-hover:text-background transition-colors" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
