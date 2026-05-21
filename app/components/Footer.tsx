import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="oz-footer">
      <div className="oz-footer__inner">
        <div className="oz-footer__grid">
          <div className="oz-footer__brand-col">
            <div className="oz-footer__brand">
              <img src="/icon.png" alt="OZERA" className="oz-footer__brand-img" />
              <span>OZERA</span>
            </div>
            <p className="oz-footer__description">
              Каталог платних озер України для риболовлі. Знаходь місце для лову, перевіряй умови й відкривай маршрут в один клік.
            </p>
          </div>

          <div>
            <h4 className="oz-footer__heading">Навігація</h4>
            <nav className="oz-footer__nav">
              <Link href="/lakes" className="oz-footer__link">
                Каталог озер
              </Link>
              <Link href="/lakes/add" className="oz-footer__link">
                Додати озеро
              </Link>
              <Link href="/#about" className="oz-footer__link">
                Про нас
              </Link>
              <Link href="/terms" className="oz-footer__link">
                Умови використання
              </Link>
              <Link href="/privacy" className="oz-footer__link">
                Конфіденційність
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="oz-footer__heading">Контакти</h4>
            <div className="oz-footer__nav">
              <a href="mailto:ozeraapp@gmail.com" className="oz-footer__link">
                ozeraapp@gmail.com
              </a>
              <span className="oz-footer__link">Україна</span>
            </div>
          </div>
        </div>

        <div className="oz-footer__bottom">
          <p>© 2026 OZERA. Усі права захищені.</p>
        </div>
      </div>
    </footer>
  );
}
