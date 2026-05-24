import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="oz-footer">
      <div className="oz-footer__inner">
        <div className="oz-footer__grid">
          <div className="oz-footer__brand">
            <Link href="/" className="oz-footer__logo" aria-label="OZERA головна">
              <Image src="/icon.png" alt="" width={48} height={48} className="oz-footer__logo-icon" />
              <span>OZERA</span>
            </Link>

            <p className="oz-footer__description">
              Каталог платних озер України для риболовлі. Знаходь місце для лову,
              перевіряй умови й відкривай маршрут в один клік.
            </p>

            <div className="oz-footer__socials" aria-label="Соціальні мережі">
              <a
                href="https://www.instagram.com/ozera.ua/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram OZERA"
                className="oz-footer__social-link"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.645.069-4.849.069-3.204 0-3.584-.012-4.849-.069-3.259-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="oz-footer__column">
            <h2 className="oz-footer__heading">Навігація</h2>
            <nav className="oz-footer__links" aria-label="Footer navigation">
              <Link href="/lakes" className="oz-footer__link">Каталог озер</Link>
              <Link href="/lakes/add" className="oz-footer__link">Додати озеро</Link>
              <Link href="/terms" className="oz-footer__link">Умови використання</Link>
              <Link href="/privacy" className="oz-footer__link">Конфіденційність</Link>
            </nav>
          </div>

          <div className="oz-footer__column">
            <h2 className="oz-footer__heading">Контакти</h2>
            <div className="oz-footer__contacts">
              <a href="mailto:ozeraapp@gmail.com" className="oz-footer__contact">
                <span className="oz-footer__contact-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                ozeraapp@gmail.com
              </a>
              <p className="oz-footer__contact">
                <span className="oz-footer__contact-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                Україна
              </p>
            </div>
          </div>
        </div>

        <div className="oz-footer__bottom">
          <p>© {currentYear} OZERA. Усі права захищені.</p>
          <p>Знайди своє ідеальне місце для риболовлі</p>
        </div>
      </div>
    </footer>
  );
}
