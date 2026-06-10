"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import AppLaunchModal from "./AppLaunchModal";
import Footer from "./Footer";

type Props = {
  children: ReactNode;
};

export default function SiteChrome({ children }: Props) {
  const pathname = usePathname();
  const isTripInvitePage = pathname.startsWith("/trips/invite/");

  return (
    <>
      {!isTripInvitePage && <AppLaunchModal />}
      {children}
      {!isTripInvitePage && <Footer />}
    </>
  );
}
