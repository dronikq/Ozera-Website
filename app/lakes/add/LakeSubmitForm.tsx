"use client";

import Link from "next/link";
import { RefObject, FormEvent, useRef, useState } from "react";

type Props = {
  photoFieldRef?: RefObject<HTMLTextAreaElement | null>;
  photoFieldPulse?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = "name" | "region" | "address" | "info" | "submitter_contact";
type FieldErrors = Partial<Record<FieldName, string>>;

const FIELD_ERROR_IDS: Record<FieldName, string> = {
  name: "add-lake-name-error",
  region: "add-lake-region-error",
  address: "add-lake-address-error",
  info: "add-lake-info-error",
  submitter_contact: "add-lake-contact-error",
};

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

export default function LakeSubmitForm({ photoFieldRef, photoFieldPulse = false }: Props) {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const setFieldRef = (field: FieldName) => (element: HTMLInputElement | HTMLTextAreaElement | null) => {
    fieldRefs.current[field] = element;
  };

  const validate = (formData: FormData) => {
    const nextErrors: FieldErrors = {};

    const lakeName = String(formData.get("name") ?? "").trim();
    const region = String(formData.get("region") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const info = String(formData.get("info") ?? "").trim();
    const submitterContact = String(formData.get("submitter_contact") ?? "").trim();

    if (!lakeName) nextErrors.name = "Вкажіть назву озера.";
    if (!region) nextErrors.region = "Вкажіть область або регіон.";
    if (!address) nextErrors.address = "Додайте адресу або посилання на Google Maps.";
    if (!info) nextErrors.info = "Опишіть, що відомо про озеро.";

    if (submitterContact.length < 5) {
      nextErrors.submitter_contact = "Залиште email або телефон для зв’язку.";
    }

    return nextErrors;
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);

    const lakeName = String(formData.get("name") ?? "").trim();
    const region = String(formData.get("region") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const info = String(formData.get("info") ?? "").trim();
    const contacts = String(formData.get("contacts") ?? "").trim();
    const photoLinks = String(formData.get("photo_links") ?? "").trim();
    const submitterContact = String(formData.get("submitter_contact") ?? "").trim();

    const nextErrors = validate(formData);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);

      const firstErrorField = (["name", "region", "address", "info", "submitter_contact"] as FieldName[]).find(
        (field) => nextErrors[field]
      );

      if (firstErrorField) {
        const firstInvalidField = fieldRefs.current[firstErrorField];
        if (firstInvalidField) {
          firstInvalidField.focus({ preventScroll: true });
          firstInvalidField.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      return;
    }

    setPending(true);

    const message = [
      `НАЗВА: ${lakeName}`,
      `РЕГІОН / ОБЛАСТЬ: ${region}`,
      `МІСТО / НАСЕЛЕНИЙ ПУНКТ: ${city || "—"}`,
      `АДРЕСА / GOOGLE MAPS: ${address}`,
      "",
      "ЩО ВІДОМО ПРО ОЗЕРО:",
      info,
      "",
      "КОНТАКТИ ОЗЕРА:",
      contacts || "—",
      "",
      "ПОСИЛАННЯ НА ФОТО:",
      photoLinks || "—",
      "",
      "—".repeat(30),
      `ЗВ'ЯЗОК ДЛЯ УТОЧНЕНЬ: ${submitterContact}`,
    ].join("\n");

    const payload = {
      access_key: "b35a5e4d-41fd-4b10-a3d3-9bcc48cb7ccc",
      subject: `Нова заявка: ${lakeName} (${region})`,
      from_name: "OZERA — Додати озеро",
      message,
      replyto: EMAIL_RE.test(submitterContact) ? submitterContact : undefined,
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? "Не вдалося надіслати. Спробуйте ще раз.");
      }

      form.reset();
      setSuccess(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Помилка з'єднання. Перевірте інтернет і спробуйте ще раз."
      );
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="dk-form-success">
        <div className="dk-form-success-icon" aria-hidden="true">
          <SuccessIcon />
        </div>

        <h2 className="dk-form-success-title">Дякуємо!</h2>
        <p className="dk-form-success-text">
          Заявку отримано. Ми перевіримо інформацію перед публікацією і, якщо все ок, додамо озеро до каталогу.
        </p>

        <Link href="/lakes" className="oz-btn-primary dk-form-success-link">
          Переглянути каталог
        </Link>
      </div>
    );
  }

  return (
    <form className="dk-add-form" onSubmit={handleSubmit} noValidate>
      <div className="dk-form-header">
        <p className="dk-form-kicker">Інформація про озеро</p>
        <h2 id="add-lake-form-title">Розкажіть про водойму</h2>
        <p className="dk-form-subtitle">
          Чим більше деталей, тим легше нам перевірити озеро і підготувати якісну картку для каталогу.
        </p>
      </div>

      <div className="dk-form-grid">
        <label className={`dk-field dk-field-span-2 ${fieldErrors.name ? "has-error" : ""}`} htmlFor="name">
          <span className="dk-label">Назва озера *</span>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Наприклад: Озеро Тихе"
            className="dk-input"
            ref={setFieldRef("name")}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? FIELD_ERROR_IDS.name : undefined}
            onChange={() => clearFieldError("name")}
          />
          {fieldErrors.name && (
            <span className="dk-field-error" id={FIELD_ERROR_IDS.name}>
              {fieldErrors.name}
            </span>
          )}
        </label>

        <label className={`dk-field ${fieldErrors.region ? "has-error" : ""}`} htmlFor="region">
          <span className="dk-label">Регіон / Область *</span>
          <input
            id="region"
            name="region"
            type="text"
            required
            placeholder="Наприклад: Київська обл."
            className="dk-input"
            ref={setFieldRef("region")}
            aria-invalid={Boolean(fieldErrors.region)}
            aria-describedby={fieldErrors.region ? FIELD_ERROR_IDS.region : undefined}
            onChange={() => clearFieldError("region")}
          />
          {fieldErrors.region && (
            <span className="dk-field-error" id={FIELD_ERROR_IDS.region}>
              {fieldErrors.region}
            </span>
          )}
        </label>

        <label className="dk-field" htmlFor="city">
          <span className="dk-label">Місто / Населений пункт</span>
          <input
            id="city"
            name="city"
            type="text"
            placeholder="Наприклад: Бориспіль"
            className="dk-input"
          />
        </label>

        <label className={`dk-field dk-field-span-2 ${fieldErrors.address ? "has-error" : ""}`} htmlFor="address">
          <span className="dk-label">Адреса або посилання на Google Maps *</span>
          <input
            id="address"
            name="address"
            type="text"
            required
            placeholder="https://maps.google.com/... або адреса"
            className="dk-input"
            ref={setFieldRef("address")}
            aria-invalid={Boolean(fieldErrors.address)}
            aria-describedby={fieldErrors.address ? FIELD_ERROR_IDS.address : undefined}
            onChange={() => clearFieldError("address")}
          />
          {fieldErrors.address && (
            <span className="dk-field-error" id={FIELD_ERROR_IDS.address}>
              {fieldErrors.address}
            </span>
          )}
        </label>

        <label className={`dk-field dk-field-span-2 ${fieldErrors.info ? "has-error" : ""}`} htmlFor="info">
          <span className="dk-label">Що відомо про озеро *</span>
          <textarea
            id="info"
            name="info"
            required
            rows={5}
            placeholder="Яка риба водиться, ціна за добу, зручності, правила риболовлі, графік роботи тощо."
            className="dk-textarea"
            ref={setFieldRef("info")}
            aria-invalid={Boolean(fieldErrors.info)}
            aria-describedby={fieldErrors.info ? FIELD_ERROR_IDS.info : undefined}
            onChange={() => clearFieldError("info")}
          />
          {fieldErrors.info && (
            <span className="dk-field-error" id={FIELD_ERROR_IDS.info}>
              {fieldErrors.info}
            </span>
          )}
        </label>

        <label className="dk-field dk-field-span-2" htmlFor="contacts">
          <span className="dk-label">Контакти озера (необов’язково)</span>
          <textarea
            id="contacts"
            name="contacts"
            rows={3}
            placeholder="Телефон, сайт, Instagram, Facebook або інше"
            className="dk-textarea"
          />
        </label>

        <label className={`dk-field dk-field-span-2 ${photoFieldPulse ? "is-highlighted" : ""}`} htmlFor="photo_links">
          <span className="dk-label">Посилання на фото (необов’язково)</span>
          <textarea
            id="photo_links"
            name="photo_links"
            rows={3}
            ref={photoFieldRef}
            placeholder="Google Drive, Instagram, Facebook або інше посилання на фото"
            className="dk-textarea"
          />
          <span className="dk-hint">Можна додати одне або кілька посилань через кому.</span>
        </label>

        <label className={`dk-field dk-field-span-2 ${fieldErrors.submitter_contact ? "has-error" : ""}`} htmlFor="submitter_contact">
          <span className="dk-label">Ваш контакт для зв’язку *</span>
          <input
            id="submitter_contact"
            name="submitter_contact"
            type="text"
            required
            placeholder="Email або телефон — якщо виникнуть питання"
            className="dk-input"
            ref={setFieldRef("submitter_contact")}
            aria-invalid={Boolean(fieldErrors.submitter_contact)}
            aria-describedby={fieldErrors.submitter_contact ? FIELD_ERROR_IDS.submitter_contact : undefined}
            onChange={() => clearFieldError("submitter_contact")}
          />
          {fieldErrors.submitter_contact && (
            <span className="dk-field-error" id={FIELD_ERROR_IDS.submitter_contact}>
              {fieldErrors.submitter_contact}
            </span>
          )}
        </label>
      </div>

      {error && (
        <p className="dk-form-status dk-form-status-error" aria-live="polite">
          {error}
        </p>
      )}

      <button type="submit" className="dk-form-submit" disabled={pending}>
        <SendIcon />
        {pending ? "Надсилаємо..." : "Надіслати заявку"}
      </button>

      <p className="dk-form-note">
        <LockIcon />
        Ми перевіримо інформацію перед публікацією.
      </p>
    </form>
  );
}
