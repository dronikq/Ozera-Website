"use client";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#07090d]/95 backdrop-blur-xl border-b border-[#c9a84c]/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <motion.div
          className="font-serif text-xl font-bold text-[#c9a84c] tracking-widest cursor-default"
          whileHover={{ opacity: 0.8 }}
        >
          OZERA
        </motion.div>

        <div className="hidden md:flex items-center gap-10">
          {[
            { href: "#story",    label: "Про нас" },
            { href: "/lakes",    label: "Каталог" },
            { href: "mailto:info@ozera.app", label: "Контакт" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[#7a7060] hover:text-[#c9a84c] text-xs tracking-[0.2em] uppercase transition-colors duration-300"
            >
              {item.label}
            </a>
          ))}
        </div>

        <motion.a
          href="/ozera-release.apk"
          className="px-5 py-2.5 border border-[#c9a84c]/40 text-[#c9a84c] text-xs tracking-widest uppercase hover:bg-[#c9a84c] hover:text-[#07090d] transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Завантажити
        </motion.a>
      </div>
    </motion.nav>
  );
}
