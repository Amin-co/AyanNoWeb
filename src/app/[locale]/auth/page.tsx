"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/navigation";
import api from "@/lib/api";
import Container from "@/components/ui/Container";

type OTPRequestResponse = {
  success: boolean;
  phone: string;
  expiresAt: string;
  code?: string;
};

type OTPVerifyResponse = {
  success: boolean;
  token: string;
  profile: unknown;
  isNewUser?: boolean;
};

const IRAN_PHONE_REGEX = /^(?:\+?98|0)?9\d{9}$/;

const AuthPage = () => {
  const t = useTranslations("auth");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const timerActive = step === 2 && cooldown > 0;

  useEffect(() => {
    if (!timerActive) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive]);

  const requestOtp = useMutation({
    mutationFn: async (payload: { phone: string }) => {
      const { data } = await api.post<OTPRequestResponse>("/auth/otp/request", payload);
      return data;
    },
    onSuccess: (data) => {
      setStep(2);
      setMessage(
        data.code
          ? `${t("requestCode")} (${data.code})`
          : t("requestCode"),
      );
      setError(null);
      setCooldown(60);
    },
    onError: () => {
      setError(t("invalidPhone"));
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async (payload: { phone: string; code: string }) => {
      const { data } = await api.post<OTPVerifyResponse>("/auth/otp/verify", payload);
      return data;
    },
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("token", data.token);
        if (data.profile) {
          window.localStorage.setItem("profile", JSON.stringify(data.profile));
        }
      }
      setMessage(t("success"));
      setError(null);
      router.replace("/account");
    },
    onError: () => {
      setError(t("invalidCode"));
    },
  });

  const isRequestDisabled =
    requestOtp.isPending || !IRAN_PHONE_REGEX.test(phone.replace(/\s|-/g, ""));
  const isVerifyDisabled = verifyOtp.isPending || code.trim().length !== 6;

  const formattedCooldown = useMemo(() => {
    if (cooldown <= 0) return "";
    return t("resendIn", { seconds: cooldown });
  }, [cooldown, t]);

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <Stack spacing={4} maxWidth={420} mx="auto">
          <Box textAlign="center">
            <Typography component="h1" variant="h4" fontWeight={700} mb={1}>
              {t("title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === 1
                ? t("phonePlaceholder")
                : t("codePlaceholder")}
            </Typography>
          </Box>

          <Card>
            <CardContent>
              <Stack spacing={3}>
                {step === 1 ? (
                  <>
                    <TextField
                      label={t("phoneLabel")}
                      placeholder={t("phonePlaceholder")}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      type="tel"
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      disabled={isRequestDisabled}
                      onClick={() =>
                        requestOtp.mutate({
                          phone: phone.replace(/\s|-/g, ""),
                        })
                      }
                    >
                      {requestOtp.isPending ? (
                        <CircularProgress size={20} />
                      ) : (
                        t("requestCode")
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Box textAlign="center">
                      <Typography variant="subtitle1" fontWeight={600}>
                        {phone}
                      </Typography>
                    </Box>
                    <TextField
                      label={t("codeLabel")}
                      placeholder={t("codePlaceholder")}
                      value={code}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                        setCode(value);
                      }}
                      inputMode="numeric"
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      disabled={isVerifyDisabled}
                      onClick={() =>
                        verifyOtp.mutate({
                          phone: phone.replace(/\s|-/g, ""),
                          code,
                        })
                      }
                    >
                      {verifyOtp.isPending ? (
                        <CircularProgress size={20} />
                      ) : (
                        t("verifyCode")
                      )}
                    </Button>
                    <Button
                      variant="text"
                      disabled={timerActive || requestOtp.isPending}
                      onClick={() =>
                        requestOtp.mutate({
                          phone: phone.replace(/\s|-/g, ""),
                        })
                      }
                    >
                      {timerActive ? formattedCooldown : t("resend")}
                    </Button>
                  </>
                )}

                {message ? (
                  <Alert severity="success" onClose={() => setMessage(null)}>
                    {message}
                  </Alert>
                ) : null}
                {error ? (
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </main>
  );
};

export default AuthPage;
