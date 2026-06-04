import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Upload, Sparkles, FileText, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const sampleQA = [
  {
    q: "Summarize chapter 3",
    a: "Chapter 3 explores how transformer attention scales quadratically...",
  },
  {
    q: "What are the key findings?",
    a: "Three breakthroughs: emergent reasoning, in-context learning, and...",
  },
  {
    q: "Cite the methodology section",
    a: "Section 4.2 — A 12-week double-blind study across 1,284 participants.",
  },
];

function FloatingPaper({ delay = 0, x = 0, y = 0 }: { delay?: number; x?: number; y?: number }) {
  return (
    <motion.div
      className="absolute glass rounded-lg p-3 shadow-glow pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: [0, -15, 0] }}
      transition={{ delay, duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <div className="space-y-1">
          <div className="h-1 w-16 bg-primary/40 rounded" />
          <div className="h-1 w-10 bg-primary/20 rounded" />
        </div>
      </div>
    </motion.div>
  );
}

export function PdfHero() {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [10, -10]);
  const rotateY = useTransform(mouseX, [0, 1], [-10, 10]);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % sampleQA.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden grid-bg">
      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/30 blur-[120px] animate-pulse-glow" />
        <div
          className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/30 blur-[120px] animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-plasma/20 blur-[100px] animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-lg bg-aurora overflow-hidden flex items-center justify-center shadow-neon">
            <img src="/current.gif" alt="PaperMind Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">PaperMind</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden md:flex items-center gap-8 font-mono text-sm text-muted-foreground"
        >
          <a href="#features" className="hover:text-foreground transition">
            features
          </a>
          <a href="#how" className="hover:text-foreground transition">
            how_it_works
          </a>
        </motion.div>
      </nav>

      <div
        ref={containerRef}
        className="relative z-10 max-w-7xl mx-auto px-8 pt-12 pb-24 grid lg:grid-cols-2 gap-12 items-center"
        onMouseMove={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          mouseX.set((e.clientX - rect.left) / rect.width);
          mouseY.set((e.clientY - rect.top) / rect.height);
        }}
      >
        {/* Left: copy */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-mono uppercase tracking-wider"
          >
            <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
            Now with GPT-5 reasoning
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-display text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight"
          >
            Chat with
            <br />
            <span className="text-gradient">any PDF</span>
            <br />
            <span className="font-mono text-3xl md:text-4xl text-muted-foreground font-normal">
              // instantly.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground max-w-md leading-relaxed"
          >
            Drop a document. Ask anything. Get answers grounded in your file with cited passages —
            in milliseconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              to="/chat"
              className="group relative bg-aurora text-background font-semibold px-7 py-4 rounded-full shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload your PDF
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-6 pt-4 font-mono text-xs text-muted-foreground"
          >
            <div>
              <span className="text-neon">2.4M+</span> PDFs analyzed
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="text-neon">99.8%</span> accuracy
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="text-neon">&lt;200ms</span> latency
            </div>
          </motion.div>
        </div>

        {/* Right: 3D upload preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ perspective: 1200 }}
          className="relative h-[600px]"
        >
          <FloatingPaper delay={0} x={5} y={10} />
          <FloatingPaper delay={1.5} x={80} y={20} />
          <FloatingPaper delay={2.5} x={10} y={75} />
          <FloatingPaper delay={0.8} x={85} y={70} />

          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative h-full flex items-center justify-center"
          >
            {/* PDF card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-72 h-96 glass rounded-2xl shadow-glow overflow-hidden"
            >
              <div className="absolute inset-0 bg-aurora opacity-10" />
              <div className="relative p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <div className="w-2 h-2 rounded-full bg-chart-4" />
                    <div className="w-2 h-2 rounded-full bg-neon" />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    research_paper.pdf
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-3/4 bg-foreground/80 rounded" />
                  <div className="h-2 w-1/2 bg-muted-foreground/40 rounded" />
                  <div className="pt-3 space-y-1.5">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 bg-muted-foreground/20 rounded"
                        style={{ width: `${60 + Math.random() * 40}%` }}
                      />
                    ))}
                  </div>
                  <div className="pt-3 h-20 rounded bg-muted/30 border border-border" />
                  <div className="pt-2 space-y-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 bg-muted-foreground/20 rounded"
                        style={{ width: `${50 + Math.random() * 40}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Scan line */}
              <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-scan" />
            </motion.div>

            {/* Chat bubble */}
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute -right-4 top-12 w-64 glass rounded-2xl rounded-tl-sm p-4 shadow-neon"
            >
              <div className="font-mono text-[10px] text-primary uppercase mb-1">You</div>
              <div className="text-sm font-medium">{sampleQA[active].q}</div>
            </motion.div>

            <motion.div
              key={`a-${active}`}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
              className="absolute -left-8 bottom-16 w-72 glass rounded-2xl rounded-bl-sm p-4 shadow-glow"
            >
              <div className="font-mono text-[10px] text-accent uppercase mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> PaperMind
              </div>
              <div className="text-sm text-muted-foreground">{sampleQA[active].a}</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
