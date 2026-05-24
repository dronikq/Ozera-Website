"use client";

import { FormEvent, useState } from "react";

type FormStatus =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function AppComingSoonForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!EMAIL_RE.test(normalizedEmail)) {
      setStatus({ type: "error", message: "Вкажіть коректний email." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const message = [
      `EMAIL: ${normalizedEmail}`,
      "",
      "——————————————",
      "Джерело: нижній блок OZERA App Coming Soon",
      `Сторінка: ${window.location.pathname}`,
    ].join("\n");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: "b35a5e4d-41fd-4b10-a3d3-9bcc48cb7ccc",
          subject: `OZERA — email для запуску застосунку: ${normalizedEmail}`,
          from_name: "OZERA — App Coming Soon",
          message,
          replyto: normalizedEmail,
        }),
      });

      const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? "Не вдалося надіслати. Спробуйте ще раз.");
      }

      setEmail("");
      setStatus({ type: "success", message: "Дякуємо! Повідомимо, щойно застосунок буде доступний." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Не вдалося надіслати. Спробуйте ще раз.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="l-app-email-card">
      <div className="l-app-email-card-head">
        <span className="l-app-email-card-icon" aria-hidden="true">
          <BellIcon />
        </span>
        <div>
          <p className="l-app-email-title">Дізнайтесь першими про запуск</p>
          <p className="l-app-email-description">
            Залиште email — ми повідомимо, щойно застосунок буде доступний.
          </p>
        </div>
      </div>

      <form className="l-app-email-form" onSubmit={handleSubmit} noValidate>
        <label className="l-app-email-field">
          <span className="sr-only">Ваш email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Ваш email"
            value={email}
            aria-invalid={status.type === "error"}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status.type === "error") setStatus({ type: "idle", message: "" });
            }}
          />
        </label>
        <button type="submit" className="l-app-email-submit" disabled={isSubmitting}>
          {isSubmitting ? "Надсилаємо..." : "Повідомити про запуск"}
        </button>
      </form>

      <p className="l-app-email-note">
        <LockIcon />
        Без спаму. Лише повідомлення про запуск.
      </p>

      {status.message && (
        <p className={`l-app-email-status l-app-email-status-${status.type}`} aria-live="polite">
          {status.message}
        </p>
      )}
    </div>
  );
}
