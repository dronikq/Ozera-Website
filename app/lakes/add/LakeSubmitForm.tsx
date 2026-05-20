"use client";

import { useState } from "react";

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "12px 16px",
  color: "var(--text-primary)",
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const LABEL: React.CSSProperties = {
  display: "block",
  color: "var(--text-secondary)",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
};

const FIELD: React.CSSProperties = {
  marginBottom: 20,
};

const REQUIRED = <span style={{ color: "#FF5C5C" }}> *</span>;

export default function LakeSubmitForm() {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      "——————————————",
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
        setError("Не вдалося надіслати. Спробуйте ще раз.");
      }
    } catch {
      setError("Помилка зʼєднання. Перевірте інтернет і спробуйте ще раз.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-gold)",
          borderRadius: 16,
          padding: "48px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: "var(--success-bg)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 28,
            color: "var(--success)",
          }}
        >
          ✓
        </div>
        <h2 style={{ color: "var(--text-primary)", marginBottom: 12, fontSize: 24 }}>
          Дякуємо!
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
          Заявку отримано. Ми розглянемо її та додамо озеро до каталогу.
        </p>
        <a
          href="/lakes"
          style={{
            display: "inline-block",
            background: "var(--accent)",
            color: "#0B1F3A",
            fontWeight: 700,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
            fontSize: 15,
          }}
        >
          Повернутись до каталогу
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-gold)",
        borderRadius: 16,
        padding: "32px",
      }}
    >
      <div style={FIELD}>
        <label style={LABEL} htmlFor="name">
          Назва озера{REQUIRED}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Наприклад: Озеро Тихе"
          style={INPUT}
        />
      </div>

      <div style={FIELD}>
        <label style={LABEL} htmlFor="city">
          Регіон / Місто{REQUIRED}
        </label>
        <input
          id="city"
          name="city"
          type="text"
          required
          placeholder="Наприклад: Київська обл., Бориспіль"
          style={INPUT}
        />
      </div>

      <div style={FIELD}>
        <label style={LABEL} htmlFor="address">
          Адреса або посилання Google Maps
        </label>
        <input
          id="address"
          name="address"
          type="text"
          placeholder="Адреса або https://maps.google.com/..."
          style={INPUT}
        />
      </div>

      <div style={FIELD}>
        <label style={LABEL} htmlFor="contacts">
          Контакти озера (телефон, сайт, Instagram)
        </label>
        <textarea
          id="contacts"
          name="contacts"
          rows={3}
          placeholder={"+380 XX XXX XX XX\nhttps://instagram.com/...\nhttps://..."}
          style={{ ...INPUT, resize: "vertical", minHeight: 80 }}
        />
      </div>

      <div style={FIELD}>
        <label style={LABEL} htmlFor="info">
          Що відомо про озеро
        </label>
        <textarea
          id="info"
          name="info"
          rows={5}
          placeholder="Яка риба водиться, ціна за добу, зручності (парковка, альтанки), графік роботи..."
          style={{ ...INPUT, resize: "vertical", minHeight: 120 }}
        />
      </div>

      <div style={{ ...FIELD, marginBottom: 28 }}>
        <label style={LABEL} htmlFor="submitter_contact">
          Ваш контакт{REQUIRED}
        </label>
        <input
          id="submitter_contact"
          name="submitter_contact"
          type="text"
          required
          placeholder="Email або телефон — якщо виникнуть питання"
          style={INPUT}
        />
      </div>

      {error && (
        <p
          style={{
            color: "#FF5C5C",
            background: "rgba(255,92,92,0.1)",
            border: "1px solid rgba(255,92,92,0.3)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          background: pending ? "var(--bg-hover)" : "var(--accent)",
          color: pending ? "var(--text-muted)" : "#0B1F3A",
          fontWeight: 700,
          fontSize: 16,
          padding: "14px 28px",
          borderRadius: 10,
          border: "none",
          cursor: pending ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
      >
        {pending ? "Надсилаємо..." : "Надіслати заявку"}
      </button>
    </form>
  );
}
