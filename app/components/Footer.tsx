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

            {/* Social Icons - простий ряд іконок */}
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/ozera.ua/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="transition-opacity hover:opacity-70"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#A9B8D4" }}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.645.069-4.849.069-3.204 0-3.584-.012-4.849-.069-3.259-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: "#FFFFFF" }} className="font-semibold mb-4">Навігація</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/lakes" style={{ color: "#A9B8D4" }} className="text-sm hover:text-yellow-400 transition-colors">
                Каталог озер
              </Link>
              <Link href="/lakes/add" style={{ color: "#A9B8D4" }} className="text-sm hover:text-yellow-400 transition-colors">
                Додати озеро
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
              <p style={{ color: "#A9B8D4" }}>Україна</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1E3A5F" }} className="pt-8">
          {/* Bottom footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p style={{ color: "#6F85A8" }}>© {currentYear} OZERA. Усі права захищені.</p>
            <p style={{ color: "#6F85A8" }} className="text-center">Знайди своє ідеальне місце для риболовлі</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
