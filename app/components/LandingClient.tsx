"use client";
import { useEffect } from "react";

export default function LandingClient({ count }: { count: number }) {
  useEffect(() => {
    // Sticky header blur on scroll
    const header = document.getElementById("l-header");
    const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Burger menu toggle
    const burger = document.getElementById("l-burger");
    const navLinks = document.getElementById("l-nav-links");
    const onBurger = () => navLinks?.classList.toggle("open");
    burger?.addEventListener("click", onBurger);

    // Smooth scroll for anchor links
    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    const onAnchor = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const target = document.querySelector(a.getAttribute("href") ?? "");
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
    };
    anchors.forEach((a) => a.addEventListener("click", onAnchor));

    return () => {
      window.removeEventListener("scroll", onScroll);
      burger?.removeEventListener("click", onBurger);
      anchors.forEach((a) => a.removeEventListener("click", onAnchor));
    };
  }, []);

  // suppress unused warning — count is passed for server→client coordination
  void count;
  return null;
}
