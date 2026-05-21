"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type FormStatus =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20 6-11 11-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7.5h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function LakeSubmitForm() {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = (data.get("name") as string).trim();
    const city = (data.get("city") as string).trim();
    const address = (data.get("address") as string).trim();
    const contacts = (data.get("contacts") as string).trim();
    const info = (data.get("info") as string).trim();
    const submitterContact = (data.get("submitter_contact") as string).trim();

    const message = [
      `НАЗВА: ${name}`,
      `РЕГІОН / МІСТО: ${city}`,
      `АДРЕСА / GOOGLE MAPS: ${address || "—"}`,
      "",
      "КОНТАКТИ ОЗЕРА:",
      contacts || "—",
      "",
      "ДОДАТКОВА ІНФОРМАЦІЯ:",
      info || "—",
      "",
      "--------------------------------",
      `Заявка від: ${submitterContact}`,
    ].join("\n");

    const payload = {
      access_key: "b35a5e4d-41fd-4b10-a3d3-9bcc48cb7ccc",
      subject: `Нова заявка: ${name} (${city})`,
      from_name: "OZERA — Нова заявка",
      message,
      replyto: submitterContact.includes("@") ? submitterContact : undefined,
    };

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        setError("Не вдалося надіслати заявку. Спробуйте ще раз.");
      }
    } catch {
      setError("Помилка з'єднання. Перевірте інтернет і спробуйте ще раз.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="dk-add-success">
        <div className="dk-add-success__icon" aria-hidden="true">
          <CheckIcon />
        </div>
        <h2>Дякуємо!</h2>
        <p>Заявку отримано. Ми розглянемо її та додамо озеро до каталогу.</p>
        <div className="dk-add-success__actions">
          <Link href="/lakes" className="oz-btn-secondary">
            Повернутись до каталогу
          </Link>
          <Link href="/lakes/add" className="oz-btn-primary">
            Додати ще одне озеро
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="dk-add-form" onSubmit={handleSubmit}>
      <div className="dk-form-head">
        <div className="dk-form-head__icon" aria-hidden="true">
          <MailIcon />
        </div>
        <div>
          <p className="dk-form-head__title">Надішліть інформацію про водойму</p>
          <p className="dk-form-head__description">
            Можна заповнити не все. Навіть часткова інформація допоможе нам швидше перевірити озеро.
          </p>
        </div>
      </div>

      <div className="dk-form-grid">
        <div className="dk-form-field">
          <label className="dk-form-label" htmlFor="name">
            Назва озера
          </label>
          <input
            className="oz-input"
            id="name"
            name="name"
            type="text"
            required
            placeholder="Наприклад: Озеро Тихе"
          />
        </div>

        <div className="dk-form-field">
          <label className="dk-form-label" htmlFor="city">
            Регіон / місто
          </label>
          <input
            className="oz-input"
            id="city"
            name="city"
            type="text"
            required
            placeholder="Наприклад: Київська область, Бориспіль"
          />
        </div>

        <div className="dk-form-field">
          <label className="dk-form-label" htmlFor="address">
            Адреса або посилання Google Maps
          </label>
          <input
            className="oz-input"
            id="address"
            name="address"
            type="text"
            placeholder="Адреса або https://maps.google.com/..."
          />
          <p className="dk-form-hint">Якщо є точка на карті, додайте її сюди.</p>
        </div>

        <div className="dk-form-field">
          <label className="dk-form-label" htmlFor="contacts">
            Контакти озера
          </label>
          <textarea
            className="oz-input dk-form-textarea"
            id="contacts"
            name="contacts"
            rows={3}
            placeholder="+380 XX XXX XX XX
https://instagram.com/...
https://..."
          />
          <p className="dk-form-hint">Телефон, сайт або соцмережі — будь-що, що допоможе нас перевірити.</p>
        </div>

        <div className="dk-form-field">
          <label className="dk-form-label" htmlFor="info">
            Що відомо про озеро
          </label>
          <textarea
            className="oz-input dk-form-textarea dk-form-textarea--tall"
            id="info"
            name="info"
            rows={5}
            placeholder="Яка риба водиться, ціна за добу, зручності, графік роботи, парковка..."
          />
          <p className="dk-form-hint">Можна описати своїми словами, без структури.</p>
        </div>

        <div className="dk-form-field">
          <label className="dk-form-label" htmlFor="submitter_contact">
            Ваш контакт
          </label>
          <input
            className="oz-input"
            id="submitter_contact"
            name="submitter_contact"
            type="text"
            required
            placeholder="Email або телефон"
          />
          <p className="dk-form-hint">Потрібен лише для уточнення деталей, якщо вони виникнуть.</p>
        </div>
      </div>

      {error && (
        <div className="dk-form-error" role="alert">
          <span className="dk-form-error__icon" aria-hidden="true">
            <InfoIcon />
          </span>
          <p>{error}</p>
        </div>
      )}

      <button type="submit" className="oz-btn-primary dk-add-submit" disabled={pending}>
        {pending ? "Надсилаємо..." : (
          <>
            <AddIcon />
            <span>Надіслати озеро</span>
          </>
        )}
      </button>
    </form>
  );
}
