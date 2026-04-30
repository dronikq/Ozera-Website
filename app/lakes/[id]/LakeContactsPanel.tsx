"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ContactLinks = {
  email?: string;
  phone?: string[];
  website?: string;
  telegram?: string;
  instagram?: string;
  viber?: string;
} | null;

interface Props {
  lakeId: string;
  contactsEnabled: boolean;
  contacts: ContactLinks;
  initiallyOpen?: boolean;
}

export default function LakeContactsPanel({ lakeId, contactsEnabled, contacts, initiallyOpen = false }: Props) {
  const [open, setOpen] = useState(initiallyOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasContactsData = useMemo(
    () =>
      Boolean(
        contactsEnabled &&
          contacts &&
          ((contacts.phone?.length ?? 0) > 0 ||
            Boolean(contacts.email) ||
            Boolean(contacts.website) ||
            Boolean(contacts.telegram) ||
            Boolean(contacts.instagram) ||
            Boolean(contacts.viber)),
      ),
    [contacts, contactsEnabled],
  );

  useEffect(() => {
    setOpen(initiallyOpen);
  }, [initiallyOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (open) {
      params.set("tab", "contacts");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (params.get("tab") === "contacts") {
      params.delete("tab");
      const nextQuery = params.toString();
      window.history.replaceState({}, "", nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname);
    }
  }, [open]);

  if (!hasContactsData) {
    return null;
  }

  return (
    <div className="dk-contacts-panel" ref={panelRef} id={`lake-contacts-panel-${lakeId}`}>
      <button type="button" className="dk-btn-call dk-contacts-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        📞 {open ? "Сховати контакти" : "Показати контакти"}
      </button>

      {open && (
        <div className="dk-contacts-box">
          {contacts?.phone?.map((p) => (
            <a key={p} href={`tel:${p}`} className="dk-contact-link">
              📱 {p}
            </a>
          ))}
          {contacts?.email && (
            <a href={`mailto:${contacts.email}`} className="dk-contact-link">
              ✉️ {contacts.email}
            </a>
          )}
          {contacts?.website && (
            <a href={contacts.website} target="_blank" rel="noopener noreferrer" className="dk-contact-link">
              🌐 {contacts.website}
            </a>
          )}
          {contacts?.telegram && (
            <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" className="dk-contact-link">
              💬 Telegram
            </a>
          )}
          {contacts?.instagram && (
            <a href={contacts.instagram} target="_blank" rel="noopener noreferrer" className="dk-contact-link">
              📷 Instagram
            </a>
          )}
          {contacts?.viber && (
            <a href={contacts.viber} target="_blank" rel="noopener noreferrer" className="dk-contact-link">
              💜 Viber
            </a>
          )}
        </div>
      )}
    </div>
  );
}
