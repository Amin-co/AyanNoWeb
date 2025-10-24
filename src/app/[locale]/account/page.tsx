"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useQuery } from "@tanstack/react-query";
import Container from "@/components/ui/Container";
import api from "@/lib/api";

type AccountProfile = {
  phone: string;
  walletBalance?: number;
  loyaltyPoints?: number;
};

type OrderSummary = {
  _id: string;
  total: number;
  createdAt: string;
  delivery?: {
    status?: string;
  };
};

type ProfileResponse = { success: boolean; data?: AccountProfile };
type OrdersResponse = { success: boolean; data?: OrderSummary[] };

const createCurrencyFormatter = (locale: string) =>
  new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 0,
  });

export default function AccountPage() {
  const t = useTranslations("account");
  const navT = useTranslations("nav");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth");
    } else {
      setHasToken(true);
    }
  }, [router]);

  const profileQuery = useQuery({
    queryKey: ["account-profile"],
    queryFn: async () => {
      const { data } = await api.get<ProfileResponse>("/users/me");
      return data.data ?? null;
    },
    enabled: hasToken,
    retry: false,
  });

  const ordersQuery = useQuery({
    queryKey: ["account-orders"],
    queryFn: async () => {
      const { data } = await api.get<OrdersResponse>("/orders");
      return Array.isArray(data.data) ? data.data : [];
    },
    enabled: hasToken,
    retry: false,
  });

  const formatter = useMemo(() => createCurrencyFormatter(locale), [locale]);
  const currencyLabel = commonT("currency.toman");

  const isLoading = !hasToken || profileQuery.isPending || ordersQuery.isPending;
  const hasError =
    hasToken && (Boolean(profileQuery.error) || Boolean(ordersQuery.error));

  const walletBalance = profileQuery.data?.walletBalance ?? 0;
  const loyaltyPoints = profileQuery.data?.loyaltyPoints ?? 0;
  const orders = (ordersQuery.data ?? []).slice(0, 5);

  const handleViewOrder = (id: string) => {
    router.push(`/account/orders/${id}`);
  };

  const handleSignIn = () => {
    router.replace("/auth");
  };

  const handleGoToMenu = () => {
    router.push("/menu");
  };

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <Stack spacing={4}>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={700} mb={1}>
              {t("title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("description")}
            </Typography>
          </Box>

          {isLoading ? (
            <Stack alignItems="center" mt={6}>
              <CircularProgress />
            </Stack>
          ) : hasError ? (
            <Card>
              <CardContent>
                <Typography variant="body2" color="error">
                  {t("authRequired")}
                </Typography>
                <Button sx={{ mt: 2 }} variant="contained" onClick={handleSignIn}>
                  {t("signIn")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        {t("walletBalance")}
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {formatter.format(walletBalance)} {currencyLabel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {profileQuery.data?.phone}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={1.5}>
                        {t("loyaltyPoints")}
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {formatter.format(loyaltyPoints)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {t("loyaltyHint")}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Button variant="outlined" onClick={handleGoToMenu}>
                    {navT("menu")}
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      {t("recentOrders")}
                    </Typography>
                    {orders.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("emptyOrders")}
                      </Typography>
                    ) : (
                      <List disablePadding>
                        {orders.map((order) => (
                          <ListItemButton
                            key={order._id}
                            onClick={() => handleViewOrder(order._id)}
                            sx={{ borderRadius: 2, mb: 1, p: 2 }}
                          >
                            <ListItemText
                              primary={
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  gap={2}
                                >
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {t("orderId", { id: order._id.slice(-6) })}
                                  </Typography>
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    {formatter.format(order.total)} {currencyLabel}
                                  </Typography>
                                </Stack>
                              }
                              secondary={
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={1}
                                  mt={1}
                                  alignItems={{ sm: "center" }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    {t("orderDate", {
                                      value: new Date(order.createdAt).toLocaleString(
                                        locale === "fa" ? "fa-IR" : "en-US",
                                      ),
                                    })}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {t("orderStatus", { value: order.delivery?.status ?? "—" })}
                                  </Typography>
                                </Stack>
                              }
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Stack>
      </Container>
    </main>
  );
}
