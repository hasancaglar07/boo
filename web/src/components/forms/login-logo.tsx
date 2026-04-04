"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

export function LoginLogo() {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? "/dark-logo.png" : "/logo.png";

  return (
    <Link
      href="/"
      className="mx-auto flex w-fit items-center transition-opacity duration-150 hover:opacity-80"
      aria-label="Ana sayfaya git"
    >
      <span className="relative block h-10 w-[220px]">
        <Image
          src={logoSrc}
          alt="Kitap Oluşturucu"
          fill
          priority
          className="object-contain object-center"
          sizes="220px"
        />
      </span>
    </Link>
  );
}
