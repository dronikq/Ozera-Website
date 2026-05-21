"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import "../landing.css";

interface Crumb { label: string; href?: string }

interface Props {
  /** Optional breadcrumb shown below the header bar (e.g. on detail pages) */
  breadcrumbs?: Crumb[];
}

const NAV_LINKS = [
  { href: "/#about",    label: "Про нас"      },
  { href: "/lakes",     label: "Каталог озер" },
  { href: "/lakes/add", label: "Додати озеро" },
];

export default function SiteHeader({ breadcrumbs }: Props) {
  const pathname  = usePathname();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/lakes")     return pathname === "/lakes" || (pathname.startsWith("/lakes/") && pathname !== "/lakes/add");
    if (href === "/lakes/add") return pathname === "/lakes/add";
    return false; // "Про нас" is an anchor on the homepage — never "active" on other pages
  };

  return (
    <>
      <header className={`l-header${scrolled ? " scrolled" : ""}`}>
        <nav className="l-nav">
          {/* Logo */}
          <Link href="/" className="l-logo" onClick={() => setMenuOpen(false)}>
            <Image src="/icon.png" alt="OZERA" width={44} height={44} className="l-logo-img" />
            <span>OZERA</span>
          </Link>

          {/* Desktop + Mobile nav */}
          <ul className={`l-nav-links${menuOpen ? " open" : ""}`}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`l-nav-link${isActive(link.href) ? " l-nav-link-active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="l-nav-divider" aria-hidden="true" />
            <li className="l-nav-cta-item">
              <button
                type="button"
                className="l-nav-cta"
                data-app-launch-trigger
                data-app-launch-source="header"
                onClick={() => setMenuOpen(false)}
              >
                <span className="l-nav-cta-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                Отримати сповіщення
              </button>
            </li>
          </ul>

          {/* Burger */}
          <button
            className="l-burger"
            aria-label="Меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </nav>
      </header>

      {/* Breadcrumb bar (optional, for detail pages) */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="l-breadcrumb-bar">
          <div className="l-breadcrumb-inner">
            <Link href="/">Головна</Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="l-breadcrumb-entry">
                <span className="l-breadcrumb-sep">/</span>
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span className="l-breadcrumb-cur">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
