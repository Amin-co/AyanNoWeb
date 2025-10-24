"use client";

import { useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "@/navigation";
import { useTranslations } from "next-intl";
import apiAdmin from "@/lib/apiAdmin";

export default function AdminLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("admin");

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setLoading(true);

      try {
        const response = await apiAdmin.post("/auth/admin/login", {
          phone,
          password,
        });

        const token: string | undefined = response.data?.token;
        if (!token) {
          throw new Error("Missing admin token.");
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem("admin_token", token);
        }

        const redirect = searchParams.get("redirect") ?? `/${router.locale}/admin`;
        router.replace(redirect);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("error");
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [phone, password, router, searchParams, t],
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {t("login.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                لطفاً شماره موبایل و رمز عبور خود را وارد کنید.
              </Typography>
            </Box>

            <TextField
              label={t("login.phone")}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              fullWidth
              autoComplete="username"
            />
            <TextField
              label={t("login.password")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              fullWidth
              autoComplete="current-password"
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? "Signing in..." : t("login.submit")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
