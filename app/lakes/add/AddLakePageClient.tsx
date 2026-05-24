"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/app/components/SiteHeader";
import LakeSubmitForm from "./LakeSubmitForm";

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 5-6 11-8 13-2-2-8-8-8-13a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MessageCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 1 1 17 0Z" />
    </svg>
  );
}

function ClipboardListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="18" x="5" y="3" rx="2" />
      <path d="M9 3V1h6v2" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="14" x="3" y="5" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 15-4.5-4.5a2 2 0 0 0-2.8 0L8 16" />
      <path d="m11 13 2.5-2.5a2 2 0 0 1 2.8 0L21 15" />
    </svg>
  );
}

function PhotoCardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="14" x="3" y="5" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 15-4.5-4.5a2 2 0 0 0-2.8 0L8 16" />
    </svg>
  );
}

export default function AddLakePageClient() {
  const photoFieldRef = useRef<HTMLTextAreaElement>(null);
  const pulseTimerRef = useRef<number | null>(null);
  const [photoFieldPulse, setPhotoFieldPulse] = useState(false);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current !== null) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  const focusPhotoField = () => {
    const field = photoFieldRef.current;
    if (!field) return;

    field.focus({ preventScroll: true });
    field.scrollIntoView({ behavior: "smooth", block: "center" });

    setPhotoFieldPulse(false);
    window.requestAnimationFrame(() => setPhotoFieldPulse(true));

    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
    }

    pulseTimerRef.current = window.setTimeout(() => setPhotoFieldPulse(false), 950);
  };

  return (
    <div className="dk-page dk-add-page">
      <SiteHeader />

      <main className="dk-add-main">
        <div className="dk-container dk-add-shell">
          <header className="dk-add-hero">
            <span className="dk-add-badge">Додати озеро</span>
            <h1>Запропонувати озеро</h1>
            <p className="dk-add-subtitle">
              Знаєте озеро, якого немає в каталозі? Поділіться інформацією з нами — ми перевіримо її і, можливо, додамо озеро на карту.
            </p>
          </header>

          <div className="dk-add-layout">
            <section className="dk-add-card dk-add-form-card" aria-labelledby="add-lake-form-title">
              <LakeSubmitForm photoFieldRef={photoFieldRef} photoFieldPulse={photoFieldPulse} />
            </section>

            <aside className="dk-add-sidebar" aria-label="Підказки для форми">
              <section className="dk-add-card dk-add-help-card">
                <p className="dk-card-kicker">Що важливо вказати</p>

                <div className="dk-help-list">
                  <div className="dk-help-item">
                    <span className="dk-help-icon" aria-hidden="true">
                      <MapPinIcon />
                    </span>
                    <div>
                      <h3>Точна адреса або Google Maps</h3>
                      <p>Допоможе швидше перевірити місце.</p>
                    </div>
                  </div>

                  <div className="dk-help-item">
                    <span className="dk-help-icon" aria-hidden="true">
                      <MessageCircleIcon />
                    </span>
                    <div>
                      <h3>Контакти адміністрації</h3>
                      <p>Телефон, сайт або соцмережі спрощують перевірку.</p>
                    </div>
                  </div>

                  <div className="dk-help-item">
                    <span className="dk-help-icon" aria-hidden="true">
                      <ClipboardListIcon />
                    </span>
                    <div>
                      <h3>Умови, ціни та правила</h3>
                      <p>Допоможуть рибалкам краще підготуватись до поїздки.</p>
                    </div>
                  </div>

                  <div className="dk-help-item">
                    <span className="dk-help-icon" aria-hidden="true">
                      <PhotoIcon />
                    </span>
                    <div>
                      <h3>Фото або посилання на фото</h3>
                      <p>Підвищують шанси, що озеро буде додано в каталог.</p>
                    </div>
                  </div>
                </div>
              </section>

              <button
                type="button"
                className="dk-add-focus-card"
                onClick={focusPhotoField}
                aria-label="Перейти до поля посилання на фото"
              >
                <span className="dk-add-focus-icon" aria-hidden="true">
                  <PhotoCardIcon />
                </span>

                <span className="dk-add-focus-copy">
                  <span className="dk-add-focus-title">Посилання на фото</span>
                  <span className="dk-add-focus-text">
                    Додайте посилання на фото озера з Google Drive, Instagram, Facebook або іншого сервісу.
                  </span>
                  <span className="dk-add-focus-note">Чим більше якісних фото — тим легше перевірити озеро.</span>
                </span>

                <span className="dk-add-focus-action" aria-hidden="true">
                  Перейти
                </span>
              </button>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
