"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import "./app-launch-modal.css";

type Status =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type FieldErrors = {
  name?: string;
  email?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BENEFITS = [
  {
    title: "Карта",
    text: "платних водойм",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18.5 9 20l-5-1.5v-13L9 7l6-1.5 5 1.5v8" />
        <path d="M9 7v13" />
        <path d="M15 5.5v5" />
        <path d="M18 22s4-3.2 4-7a4 4 0 0 0-8 0c0 3.8 4 7 4 7Z" />
        <circle cx="18" cy="15" r="1" />
      </svg>
    ),
  },
  {
    title: "Умови, ціни",
    text: "та правила",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    ),
  },
  {
    title: "Поради",
    text: "для риболовлі",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 13.5C17 19 11 21 5 19c-2-6 0-12 5.5-14.5C12 8 16 12 19.5 13.5Z" />
        <path d="M9 15c3.5-1 6-3.5 7.5-7.5" />
      </svg>
    ),
  },
];

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12 19.79 19.79 0 0 1 2.08 3.37 2 2 0 0 1 4.06 1.2h3a2 2 0 0 1 2 1.72c.12.91.33 1.8.62 2.65a2 2 0 0 1-.45 2.11L8 8.91a16 16 0 0 0 7.09 7.09l1.23-1.23a2 2 0 0 1 2.11-.45c.85.29 1.74.5 2.65.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function AppLaunchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState("unknown");
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>("[data-app-launch-trigger]");
      if (!trigger) return;

      event.preventDefault();
      setSource(trigger.dataset.appLaunchSource ?? "unknown");
      setStatus({ type: "idle", message: "" });
      setFieldErrors({});
      setIsOpen(true);
      document.getElementById("l-nav-links")?.classList.remove("open");
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => nameRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      const phone = String(formData.get("phone") ?? "").trim();

      const nextErrors: FieldErrors = {};
      if (!name) nextErrors.name = "Вкажіть ім’я";
      if (!email || !EMAIL_RE.test(email)) nextErrors.email = "Вкажіть коректний email";

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        return;
      }

      setFieldErrors({});
      setIsSubmitting(true);

      const message = [
        `ІМʼЯ: ${name}`,
        `EMAIL: ${email}`,
        `ТЕЛЕФОН: ${phone || "—"}`,
        "",
        "——————————————",
        `Джерело: ${source}`,
        `Сторінка: ${window.location.pathname}`,
      ].join("\n");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: "b35a5e4d-41fd-4b10-a3d3-9bcc48cb7ccc",
          subject: `OZERA — заявка на запуск застосунку: ${name}`,
          from_name: "OZERA — запуск застосунку",
          message,
          replyto: email,
        }),
      });

      const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? "Не вдалося надіслати. Спробуйте ще раз.");
      }

      form.reset();
      setStatus({
        type: "success",
        message: "Ми напишемо вам, щойно OZERA буде доступна.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Не вдалося відправити заявку.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="app-launch-modal-backdrop" onMouseDown={() => setIsOpen(false)}>
      <div
        className="app-launch-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-launch-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="app-launch-modal-close"
          aria-label="Закрити"
          onClick={() => setIsOpen(false)}
        >
          ×
        </button>

        {status.type === "success" ? (
          <div className="app-launch-success">
            <span className="app-launch-success-icon" aria-hidden="true">✓</span>
            <h2 id="app-launch-modal-title" className="app-launch-modal-title">Дякуємо!</h2>
            <p className="app-launch-modal-subtitle">{status.message}</p>
            <button type="button" className="app-launch-submit" onClick={() => setIsOpen(false)}>
              Закрити
            </button>
          </div>
        ) : (
          <>
            <div className="app-launch-content">
              <div className="app-launch-badge">
                <Image src="/icon.png" alt="" width={20} height={20} className="app-launch-badge-icon" />
                <span className="app-launch-badge-text">
                  <strong>OZERA</strong>
                  <span>• ранній доступ</span>
                </span>
              </div>

              <h2 id="app-launch-modal-title" className="app-launch-modal-title">
                Дізнайтесь першими{" "}<br />
                про запуск <span>OZERA</span>
              </h2>

              <p className="app-launch-modal-subtitle">
                Залиште контакти — ми напишемо, щойно застосунок для рибалок буде доступний.
              </p>

              <form className="app-launch-form" onSubmit={onSubmit} noValidate>
                <label className={`app-launch-field ${fieldErrors.name ? "has-error" : ""}`}>
                  <span className="app-launch-field-row">
                    <span className="app-launch-field-icon" aria-hidden="true"><UserIcon /></span>
                    <input
                      ref={nameRef}
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Ваше ім’я"
                      aria-label="Ваше ім’я"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "app-launch-name-error" : undefined}
                      onChange={() => setFieldErrors((errors) => ({ ...errors, name: undefined }))}
                    />
                  </span>
                  {fieldErrors.name && <small id="app-launch-name-error">{fieldErrors.name}</small>}
                </label>

                <label className={`app-launch-field ${fieldErrors.email ? "has-error" : ""}`}>
                  <span className="app-launch-field-row">
                    <span className="app-launch-field-icon" aria-hidden="true"><MailIcon /></span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Email"
                      aria-label="Email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "app-launch-email-error" : undefined}
                      onChange={() => setFieldErrors((errors) => ({ ...errors, email: undefined }))}
                    />
                  </span>
                  {fieldErrors.email && <small id="app-launch-email-error">{fieldErrors.email}</small>}
                </label>

                <label className="app-launch-field">
                  <span className="app-launch-field-row">
                    <span className="app-launch-field-icon" aria-hidden="true"><PhoneIcon /></span>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Телефон (необов’язково)"
                      aria-label="Телефон необов’язково"
                    />
                  </span>
                </label>

                <button type="submit" className="app-launch-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Надсилаємо..." : "Повідомити про запуск"}
                </button>

                <p className="app-launch-privacy">
                  <LockIcon />
                  Без спаму. Лише повідомлення про запуск.
                </p>

                {status.type === "error" && (
                  <p className="app-launch-form-error" aria-live="polite">
                    {status.message}
                  </p>
                )}
              </form>
            </div>

            <div className="app-launch-benefits">
              {BENEFITS.map((benefit) => (
                <div className="app-launch-benefit" key={benefit.title}>
                  <span className="app-launch-benefit-icon" aria-hidden="true">{benefit.icon}</span>
                  <span>
                    <strong>{benefit.title}</strong>
                    <small>{benefit.text}</small>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
