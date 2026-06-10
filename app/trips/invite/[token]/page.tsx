import Image from "next/image";
import { headers } from "next/headers";

import InviteCopyButton from "./InviteCopyButton";
import "./invite.css";

const INVITE_BASE_URL = "https://ozera.in.ua/trips/invite";
const APP_STORE_URL = "https://apps.apple.com/ua/app/ozera/id6765619438?l=ru";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const inviteUrl = `${INVITE_BASE_URL}/${encodeURIComponent(token)}`;

  return {
    title: { absolute: `Запрошення до поїздки ${token} | OZERA` },
    description: "Fallback-сторінка для запрошення до поїздки в Ozera.",
    alternates: {
      canonical: inviteUrl,
    },
    openGraph: {
      title: `Запрошення до поїздки ${token} | OZERA`,
      description: "Fallback-сторінка для запрошення до поїздки в Ozera.",
      url: inviteUrl,
      siteName: "OZERA",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Запрошення до поїздки ${token} | OZERA`,
      description: "Fallback-сторінка для запрошення до поїздки в Ozera.",
    },
  };
}

export default async function TripInvitePage({ params }: PageProps) {
  const { token } = await params;
  const userAgent = (await headers()).get("user-agent") ?? "";
  const isAndroid = /Android/i.test(userAgent);
  const inviteUrl = `${INVITE_BASE_URL}/${encodeURIComponent(token)}`;

  return (
    <main className="invite-page">
      <div className="invite-shell">
        <section className="invite-card" aria-labelledby="invite-title">
          <header className="invite-header">
            <Image src="/icon.png" alt="Ozera" width={56} height={56} className="invite-logo" />
            <div className="invite-brand">
              <strong>OZERA</strong>
              <span>Trips invite</span>
            </div>
          </header>

          <div className="invite-eyebrow">Запрошення до поїздки</div>
          <h1 id="invite-title" className="invite-title">Вас запросили до поїздки в Ozera</h1>
          <p className="invite-copy">
            Відкрийте застосунок, щоб приєднатися до поїздки, переглянути учасників та планування.
          </p>

          {isAndroid ? (
            <div className="invite-android">Android-версія скоро</div>
          ) : (
            <div className="invite-actions" aria-label="Дії для запрошення">
              <a href={inviteUrl} className="oz-btn-primary">
                Відкрити в Ozera
              </a>
              <a href={APP_STORE_URL} className="oz-btn-secondary" target="_blank" rel="noopener noreferrer">
                Завантажити в App Store
              </a>
            </div>
          )}

          <div className="invite-meta">
            <div className="invite-meta-row">
              <span className="invite-meta-label">Fallback</span>
              <p className="invite-note">
                Якщо застосунок не відкрився — встановіть Ozera з App Store, а потім скористайтесь кодом запрошення.
              </p>
            </div>

            <div className="invite-meta-row">
              <span className="invite-meta-label">Код запрошення</span>
              <div className="invite-token" aria-label="Код запрошення">
                <span>{token}</span>
              </div>
              <InviteCopyButton value={token} label="Скопіювати код" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
