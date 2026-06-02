import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ADHKAR = [
  "سبحان الله",
  "الحمد لله",
  "لا إله إلا الله",
  "الله أكبر",
  "أستغفر الله العظيم",
  "سبحان الله وبحمده",
  "سبحان الله العظيم",
  "لا حول ولا قوة إلا بالله",
  "اللهم صلِّ على محمد ﷺ",
  "سبحان الله وبحمده سبحان الله العظيم",
  "الحمد لله رب العالمين",
  "لا إله إلا الله وحده لا شريك له",
];

const INTERVAL_MS = 30_000;
const DISPLAY_MS = 3_000;

export function DhikrToast() {
  const [dhikr, setDhikr] = useState<string | null>(null);

  useEffect(() => {
    const show = () => {
      const random = ADHKAR[Math.floor(Math.random() * ADHKAR.length)];
      setDhikr(random);
      setTimeout(() => setDhikr(null), DISPLAY_MS);
    };

    const timer = setInterval(show, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {dhikr && (
        <motion.div
          key={dhikr}
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed bottom-6 left-6 z-[9999] pointer-events-none"
          dir="rtl"
        >
          <div className="bg-primary/90 backdrop-blur-md text-primary-foreground px-5 py-3 rounded-2xl shadow-xl border border-primary/30 min-w-[140px] text-center">
            <p className="text-sm font-semibold tracking-wide leading-relaxed">{dhikr}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
