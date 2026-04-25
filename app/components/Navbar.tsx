"use client";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 20));

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-blue-100/50 border-b border-blue-100/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="w-9 h-9 rounded-xl bg-[#0f2a4a] flex items-center justify-center text-lg shadow-lg">
            🎣
          </div>
          <span className="font-bold text-[#0f2a4a] text-lg tracking-tight">OZERA</span>
        </motion.div>

        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-500 hover:text-[#0f2a4a] font-medium transition-colors hidden md:block">
            Можливості
          </a>
          <a href="#about" className="text-sm text-slate-500 hover:text-[#0f2a4a] font-medium transition-colors hidden md:block">
            Про нас
          </a>
          <motion.a
            href="#download"
            className="px-5 py-2.5 rounded-full bg-[#0f2a4a] text-white text-sm font-semibold shadow-lg shadow-[#0f2a4a]/20"
            whileHover={{ scale: 1.04, backgroundColor: "#1a3a5c" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            Скачати
          </motion.a>
        </div>
      </div>
    </motion.nav>
  );
}
