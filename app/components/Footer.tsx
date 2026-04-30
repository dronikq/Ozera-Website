import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: "#0F2A4D", borderTop: "1px solid #1E3A5F" }} className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand & Description + Instagram */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 style={{ color: "#FFFFFF" }} className="text-xl font-bold mb-2">OZERA</h3>
              <p style={{ color: "#A9B8D4" }} className="text-sm">
                Каталог платних озер України для риболовлі. Знаходи ідеальне місце для лову разом з нами.
              </p>
            </div>

            {/* Instagram Link */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/ozera.ua/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Стежити за нами на Instagram"
                className="transition-transform duration-200 hover:scale-110"
                title="Instagram"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 256 256"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="instagramGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: "#FFC857", stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: "#FF5C9A", stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: "#9B36B7", stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect x="16" y="16" width="224" height="224" rx="32" fill="url(#instagramGradient)" />
                  <circle cx="128" cy="128" r="40" fill="none" stroke="#FFFFFF" strokeWidth="12" />
                  <circle cx="170" cy="86" r="12" fill="#FFFFFF" />
                </svg>
              </a>
              <span style={{ color: "#6F85A8" }} className="text-sm">@ozera.ua</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: "#FFFFFF" }} className="font-semibold mb-4">Навігація</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/lakes" style={{ color: "#A9B8D4" }} className="text-sm hover:text-yellow-400 transition-colors">
                Каталог озер
              </Link>
              <a href="mailto:support@ozera.in.ua" style={{ color: "#A9B8D4" }} className="text-sm hover:text-yellow-400 transition-colors">
                Контакти
              </a>
              <Link href="/terms" style={{ color: "#A9B8D4" }} className="text-sm hover:text-yellow-400 transition-colors">
                Умови використання
              </Link>
              <Link href="/privacy" style={{ color: "#A9B8D4" }} className="text-sm hover:text-yellow-400 transition-colors">
                Конфіденційність
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ color: "#FFFFFF" }} className="font-semibold mb-4">Контакти</h4>
            <div className="flex flex-col gap-3 text-sm">
              <a href="mailto:support@ozera.in.ua" style={{ color: "#A9B8D4" }} className="hover:text-yellow-400 transition-colors">
                support@ozera.in.ua
              </a>
              <p style={{ color: "#A9B8D4" }}>Україна 🇺🇦</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1E3A5F" }} className="pt-8">
          {/* Bottom footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p style={{ color: "#6F85A8" }}>© {currentYear} OZERA. Усі права захищені.</p>
            <p style={{ color: "#6F85A8" }} className="text-center">Знайди своє ідеальне місце для риболовлі 🎣</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
