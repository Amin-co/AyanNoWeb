"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "@/navigation";

type AdminGuardProps = {
  children: ReactNode;
  locale: string;
};

const AdminGuard = ({ children, locale }: AdminGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const localePrefix = `/${locale}`;
  const normalizedPath = pathname.startsWith(localePrefix)
    ? pathname.slice(localePrefix.length) || "/"
    : pathname || "/";
  const isLoginRoute = normalizedPath.startsWith("/admin/login");
  const [verified, setVerified] = useState(isLoginRoute);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("admin_token");
    if (!token) {
      if (!isLoginRoute) {
        const loginPath = `/${locale}/admin/login`;
        router.replace(`${loginPath}?redirect=${encodeURIComponent(normalizedPath)}`);
      } else {
        setVerified(true);
      }
      return;
    }

    setVerified(true);
  }, [isLoginRoute, locale, normalizedPath, router]);

  if (!verified) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
