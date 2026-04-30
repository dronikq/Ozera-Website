import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-blue-50 to-blue-100 border-t border-blue-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand & Description */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-slate-900">OZERA</h3>
            <p className="text-sm text-slate-600">
              Каталог платних озер України для риболовлі. Знаходи ідеальне місце для лову разом з нами.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://www.instagram.com/ozera.ua/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Стежити за нами на Instagram"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-blue-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                title="Instagram"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <circle cx="17.5" cy="6.5" r="1.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Навігація</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/lakes" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Каталог озер
              </Link>
              <a href="mailto:support@ozera.in.ua" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Контакти
              </a>
              <Link href="/terms" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Умови використання
              </Link>
              <Link href="/privacy" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Конфіденційність
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Контакти</h4>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <a href="mailto:support@ozera.in.ua" className="hover:text-blue-600 transition-colors">
                support@ozera.in.ua
              </a>
              <p>Україна</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-200 pt-8">
          {/* Bottom footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>© {currentYear} OZERA. Усі права захищені.</p>
            <p className="text-center">Знайди своє ідеальне місце для риболовлі</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
