import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function Icon({ size = 20, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function AreaIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 16 16 5l3 3L8 19l-3-3Z" />
      <path d="M9 8l2 2M12 5l2 2M15 8l2 2" />
    </Icon>
  );
}

export function DepthIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 14c1.5 0 2.5-1 3.5-1s2 .9 3.5.9 2.5-1 3.5-1 2 .9 3.5.9 2.5-1 3.5-1 2 .9 3.5.9" />
      <path d="M3 18c1.5 0 2.5-1 3.5-1s2 .9 3.5.9 2.5-1 3.5-1 2 .9 3.5.9 2.5-1 3.5-1 2 .9 3.5.9" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Icon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </Icon>
  );
}

export function NavigationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19 19 5l-4 14-3-6-6-3 14-4" />
    </Icon>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19c3 0 3-4 6-4s3 4 6 4 3-4 6-4" />
      <path d="M6 7h2l3 5 3-4h4" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4.5h3l1.5 5-2 1.5c1 2.1 2.4 3.5 4.5 4.5L14.5 13 19.5 14.5v3c0 1.1-.9 2-2 2C10 19.5 4.5 14 4.5 6.5c0-1.1.9-2 2-2Z" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.2 2 3.5 4.5 3.5 8S14.2 18 12 20c-2.2-2-3.5-4.5-3.5-8S9.8 6 12 4Z" />
    </Icon>
  );
}

export function MessageCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5 8.8 8.8 0 0 1-3.6-.8L4 21l1.3-4.1A8.5 8.5 0 1 1 21 12Z" />
    </Icon>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M8 6.5 9.5 4h5L16 6.5" />
    </Icon>
  );
}

export function FishIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12c2.2-3.1 5-4.7 8-4.7 3.2 0 6 1.6 8 4.7-2 3.1-4.8 4.7-8 4.7-3 0-5.8-1.6-8-4.7Z" />
      <path d="M4 12H2M18.2 9.8l2.8-2.2M18.2 14.2l2.8 2.2" />
      <circle cx="10" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 8h12" />
      <path d="M8 8v8m8-8v8" />
      <path d="M4 16h16" />
      <path d="M9 16a3 3 0 0 0 6 0" />
    </Icon>
  );
}

export function TentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19 12 5l8 14H4Z" />
      <path d="M12 5v14" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8.2h.01" />
    </Icon>
  );
}

export function BackpackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5.5h6A4 4 0 0 1 19 9.5V19H5V9.5a4 4 0 0 1 4-4Z" />
      <path d="M9 5.5V4.2A1.2 1.2 0 0 1 10.2 3h3.6A1.2 1.2 0 0 1 15 4.2v1.3" />
      <path d="M8 12h8" />
    </Icon>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5l1.6 4.1L18 9.2l-4.4 1.6L12 15l-1.6-4.2L6 9.2l4.4-1.6L12 3.5Z" />
      <path d="M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z" />
    </Icon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Icon>
  );
}
