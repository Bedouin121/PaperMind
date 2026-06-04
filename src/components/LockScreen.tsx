import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, Sparkles, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { unlockWithPassword, checkSession } from "@/lib/api/auth.functions";
import { saveSession, loadSession, clearSession } from "@/lib/session";

type Props = {
  onUnlocked: (token: string) => void;
};

export function LockScreen({ onUnlocked }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // checking existing session
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // On mount, check if there's already a valid session in sessionStorage
  useEffect(() => {
    const token = loadSession();
    if (!token) {
      setChecking(false);
      setTimeout(() => inputRef.current?.focus(), 400);
      return;
    }
    checkSession({ data: { token } })
      .then(({ valid }) => {
        if (valid) {
          onUnlocked(token);
        } else {
          clearSession();
          setChecking(false);
          setTimeout(() => inputRef.current?.focus(), 400);
        }
      })
      .catch(() => {
        clearSession();
        setChecking(false);
      });
  }, [onUnlocked]);

  const handleUnlock = async () => {
    if (!password || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { token } = await unlockWithPassword({ data: { password } });
      saveSession(token);
      onUnlocked(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect password.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword("");
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="fixed inset-0 bg-background grid-bg flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background grid-bg flex items-center justify-center z-50 overflow-hidden">
      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/25 blur-[120px] animate-pulse-glow" />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent/25 blur-[120px] animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Card */}
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="glass rounded-3xl p-8 shadow-glow"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-16 h-16 rounded-2xl bg-aurora overflow-hidden flex items-center justify-center shadow-glow mb-4"
            >
              <img src="/current.gif" alt="PaperMind Logo" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold">PaperMind</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">// access restricted</p>
          </div>

          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl glass border border-primary/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6">
            Enter your password to unlock
          </p>

          {/* Input */}
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="Password"
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-primary/60 focus:shadow-neon transition-all placeholder:text-muted-foreground/50 font-mono"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-destructive text-xs mb-4 px-1"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unlock button */}
          <button
            onClick={handleUnlock}
            disabled={!password || loading}
            className="w-full bg-aurora text-background font-semibold py-3 rounded-xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            {loading ? "Verifying…" : "Unlock"}
          </button>
        </motion.div>

        <p className="text-center font-mono text-[10px] text-muted-foreground/50 mt-4">
          Session expires when you close the tab
        </p>
      </motion.div>
    </div>
  );
}
