"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import "../landing.css";

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  /** Optional breadcrumb shown below the header bar (e.g. on detail pages) */
  breadcrumbs?: Crumb[];
}

const NAV_LINKS = [
  { href: "/lakes", label: "Каталог" },
  { href: "/#about", label: "Про нас" },
  { href: "/lakes/add", label: "Додати озеро" },
];

export default function SiteHeader({ breadcrumbs }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/lakes") return pathname === "/lakes" || (pathname.startsWith("/lakes/") && pathname !== "/lakes/add");
    if (href === "/lakes/add") return pathname === "/lakes/add";
    return false;
  };

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
  };

  return (
    <>
      <header className={`l-header${scrolled ? " scrolled" : ""}`}>
        <nav className="l-nav">
          <Link href="/" className="l-logo" onClick={closeMobileMenu}>
            <Image src="/icon.png" alt="OZERA" width={42} height={42} className="l-logo-img" />
            <span>OZERA</span>
          </Link>

          <div className="l-nav-desktop">
            <ul className="l-nav-links">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`l-nav-link${isActive(link.href) ? " l-nav-link-active" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="l-nav-actions">
              <div className="l-nav-divider" aria-hidden="true" />
              <button
                type="button"
                className="l-nav-cta"
                data-app-launch-trigger
                data-app-launch-source="header"
                onClick={closeMobileMenu}
              >
                <span className="l-nav-cta-icon" aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                Повідомити про запуск
              </button>
            </div>
          </div>

          <details className="l-nav-menu" ref={mobileMenuRef}>
            <summary className="l-burger" aria-label="Меню">
              <span />
              <span />
              <span />
            </summary>

            <div className="l-nav-panel">
              <ul className="l-nav-links">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`l-nav-link${isActive(link.href) ? " l-nav-link-active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="l-nav-actions">
                <div className="l-nav-divider" aria-hidden="true" />
                <button
                  type="button"
                  className="l-nav-cta"
                  data-app-launch-trigger
                  data-app-launch-source="header"
                  onClick={closeMobileMenu}
                >
                  <span className="l-nav-cta-icon" aria-hidden="true">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </span>
                  Повідомити про запуск
                </button>
              </div>
            </div>
          </details>
        </nav>
      </header>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="l-breadcrumb-bar">
          <div className="l-breadcrumb-inner">
            <Link href="/">Головна</Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="l-breadcrumb-entry">
                <span className="l-breadcrumb-sep">/</span>
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span className="l-breadcrumb-cur">{crumb.label}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
