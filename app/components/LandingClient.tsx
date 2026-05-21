"use client";
import { useEffect } from "react";

export default function LandingClient({ count }: { count: number }) {
  useEffect(() => {
    // Smooth scroll for anchor links (header/burger handled by SiteHeader)
    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    const onAnchor = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const target = document.querySelector(a.getAttribute("href") ?? "");
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
    };
    anchors.forEach((a) => a.addEventListener("click", onAnchor));
    return () => anchors.forEach((a) => a.removeEventListener("click", onAnchor));
  }, []);

  void count;
  return null;
}
