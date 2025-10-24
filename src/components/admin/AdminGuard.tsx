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
  const isLoginRoute = pathname.startsWith(`/${locale}/admin/login`);
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
      router.replace(`/${locale}/admin/login?redirect=${encodeURIComponent(pathname)}`);
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
          router.replace(`/${locale}/admin/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    };

    validate();

    return () => {
      active = false;
    };
  }, [isLoginRoute, locale, pathname, router]);

  if (!verified) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
