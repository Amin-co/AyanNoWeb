"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "@/navigation";
import apiAdmin from "@/lib/apiAdmin";

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
      if (isLoginRoute) {
        setVerified(true);
        return;
      }
      router.replace(`/admin/login?redirect=${encodeURIComponent(normalizedPath)}`);
      return;
    }

    let active = true;

    const validate = async () => {
      try {
        await apiAdmin.get("/users/me");
        if (active) {
          setVerified(true);
        }
      } catch {
        window.localStorage.removeItem("admin_token");
        if (isLoginRoute) {
          setVerified(true);
        } else {
          router.replace(`/admin/login?redirect=${encodeURIComponent(normalizedPath)}`);
        }
      }
    };

    validate();

    return () => {
      active = false;
    };
  }, [isLoginRoute, locale, normalizedPath, pathname, router]);

  if (!verified) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
