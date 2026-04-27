"use client";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 20));

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 hidden md:block ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-blue-100/50 border-b border-blue-100/50"
          : "bg-white/80 backdrop-blur border-b border-blue-100"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/icon.png"
            alt="OZERA"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="font-bold text-[#0f2a4a] text-lg">OZERA</span>
        </Link>

        <div className="flex items-center gap-6">
          <a
            href="#about"
            className="text-sm text-slate-500 hover:text-[#0f2a4a] font-medium transition-colors"
          >
            Про нас
          </a>
          <Link
            href="/lakes"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Каталог озер
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
