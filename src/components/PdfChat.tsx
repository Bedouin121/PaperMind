import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Sparkles,
  FileText,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { uploadAndIndexPdf, askQuestion, getPdfStatus, clearPdf } from "@/lib/api/pdf.functions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Source = {
  index: number;
  text: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isStub?: boolean;
  error?: boolean;
};

type UploadState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "indexing"; progress: number }
  | { status: "ready"; filename: string; chunkCount: number }
  | { status: "error"; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceCard({ source, i }: { source: Source; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className="w-full text-left glass rounded-xl px-4 py-3 hover:shadow-neon transition-all group"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-primary uppercase tracking-wider">
          Source {i + 1}
        </span>
        {open ? (
          <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-muted-foreground mt-2 leading-relaxed overflow-hidden"
          >
            {source.text}
          </motion.p>
        )}
      </AnimatePresence>
    </button>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser ? "bg-aurora shadow-glow" : "glass border border-primary/30"
        }`}
      >
        {isUser ? (
          <span className="font-mono text-xs font-bold text-background">U</span>
        ) : (
          <Sparkles className="w-4 h-4 text-primary" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-aurora text-background rounded-tr-sm shadow-glow"
              : msg.error
                ? "glass border border-destructive/50 text-destructive rounded-tl-sm"
                : "glass rounded-tl-sm"
          }`}
        >
          {msg.error && <AlertCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
          {msg.isStub && (
            <div className="flex items-center gap-1.5 mb-2 font-mono text-[10px] text-amber-400 uppercase tracking-wider">
              <AlertCircle className="w-3 h-3" />
              No API key — showing raw context
            </div>
          )}
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && !msg.isStub && (
          <div className="w-full space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground px-1">
              Referenced passages
            </p>
            {msg.sources.map((src, i) => (
              <SourceCard key={src.index} source={src} i={i} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg glass border border-primary/30 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  uploadState,
  onFile,
  onClear,
}: {
  uploadState: UploadState;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") onFile(file);
    },
    [onFile],
  );

  if (uploadState.status === "ready") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-aurora flex items-center justify-center flex-shrink-0 shadow-glow">
            <CheckCircle2 className="w-5 h-5 text-background" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{uploadState.filename}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {uploadState.chunkCount} chunks indexed · ready to chat
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="flex-shrink-0 w-8 h-8 rounded-lg glass border border-destructive/30 hover:border-destructive/60 flex items-center justify-center transition-all group"
          title="Remove PDF"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
        </button>
      </motion.div>
    );
  }

  if (uploadState.status === "parsing" || uploadState.status === "indexing") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-2xl px-5 py-4 flex items-center gap-4"
      >
        <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">
            {uploadState.status === "parsing" ? "Parsing PDF…" : "Building vector index…"}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {uploadState.status === "parsing"
              ? "Extracting text from your document"
              : "This only happens once — model loads on first run"}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={dragging ? { scale: 1.02 } : { scale: 1 }}
        className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden
          ${dragging ? "border-primary shadow-neon" : "border-border hover:border-primary/50"}
          glass p-8 flex flex-col items-center gap-3 text-center`}
      >
        <div className="w-12 h-12 rounded-2xl bg-aurora flex items-center justify-center shadow-glow">
          <Upload className="w-6 h-6 text-background" />
        </div>
        <div>
          <p className="font-semibold">Drop your PDF here</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            or <span className="text-primary underline underline-offset-2">click to browse</span>
          </p>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          Any PDF · text-based · no size limit
        </p>
        {dragging && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <p className="font-semibold text-primary">Release to upload</p>
          </div>
        )}
      </motion.div>

      {uploadState.status === "error" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-start gap-2 text-destructive text-sm px-1"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{uploadState.message}</span>
        </motion.div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          // Reset so same file can be re-uploaded
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PdfChat() {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if a PDF is already loaded (e.g. on page revisit within same server session)
  useEffect(() => {
    getPdfStatus().then((status) => {
      if (status.loaded && status.filename) {
        setUploadState({
          status: "ready",
          filename: status.filename,
          chunkCount: status.chunkCount,
        });
      }
    });
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const handleFile = useCallback(async (file: File) => {
    setUploadState({ status: "parsing" });

    let base64: string;
    try {
      base64 = await fileToBase64(file);
    } catch {
      setUploadState({ status: "error", message: "Failed to read the file." });
      return;
    }

    setUploadState({ status: "indexing", progress: 0 });

    try {
      const result = await uploadAndIndexPdf({
        data: { fileBase64: base64, filename: file.name },
      });

      setUploadState({
        status: "ready",
        filename: result.filename,
        chunkCount: result.chunkCount,
      });

      // Welcome message
      setMessages([
        {
          id: uid(),
          role: "assistant",
          content: `**${result.filename}** is loaded and indexed into ${result.chunkCount} searchable chunks. Ask me anything about it.`,
        },
      ]);
    } catch (err) {
      setUploadState({
        status: "error",
        message: err instanceof Error ? err.message : "Upload failed. Please try again.",
      });
    }
  }, []);

  const handleClear = useCallback(async () => {
    await clearPdf({});
    setUploadState({ status: "idle" });
    setMessages([]);
    setInput("");
  }, []);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || isAsking || uploadState.status !== "ready") return;

    const userMsg: Message = { id: uid(), role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsAsking(true);

    try {
      const result = await askQuestion({ data: { question: q } });
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: result.answer,
        sources: result.sources,
        isStub: result.isStub,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: uid(),
        role: "assistant",
        content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  }, [input, isAsking, uploadState.status]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isReady = uploadState.status === "ready";

  return (
    <div className="relative min-h-screen grid-bg flex flex-col">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
        <div
          className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-accent/20 blur-[100px] animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            back
          </Link>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-aurora overflow-hidden flex items-center justify-center shadow-neon">
              <img src="/current.gif" alt="PaperMind Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-lg font-bold">PaperMind</span>
          </div>
        </div>
        {isReady && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
            <span className="font-mono text-xs text-muted-foreground">PDF loaded</span>
          </div>
        )}
      </nav>

      {/* Main layout */}
      <div className="relative z-10 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-6 gap-4">
        {/* Upload zone — always visible at top */}
        <UploadZone uploadState={uploadState} onFile={handleFile} onClear={handleClear} />

        {/* Chat area */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 glass rounded-2xl overflow-hidden flex flex-col"
            style={{ minHeight: "400px", maxHeight: "calc(100vh - 360px)" }}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} />
              ))}
              <AnimatePresence>{isAsking && <TypingIndicator key="typing" />}</AnimatePresence>
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}

        {/* Empty state (PDF loaded, no messages) */}
        {isReady && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 py-12"
          >
            <div className="w-16 h-16 rounded-2xl glass border border-primary/30 flex items-center justify-center shadow-glow">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-semibold">Ready to answer</p>
              <p className="text-muted-foreground text-sm mt-1">
                Ask anything about your document below
              </p>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {[
                "Summarize this document",
                "What are the key findings?",
                "What is the main argument?",
                "List the most important points",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="glass rounded-full px-4 py-2 text-sm hover:shadow-neon transition-all hover:border-primary/50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input bar */}
        <AnimatePresence>
          {isReady && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass rounded-2xl p-3 flex items-end gap-3"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your PDF… (Enter to send, Shift+Enter for newline)"
                rows={1}
                disabled={isAsking}
                className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground/60 leading-relaxed max-h-40 disabled:opacity-50"
                style={{ minHeight: "24px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isAsking}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-aurora flex items-center justify-center shadow-glow hover:scale-105 transition-transform disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isAsking ? (
                  <Loader2 className="w-4 h-4 text-background animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-background" />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
