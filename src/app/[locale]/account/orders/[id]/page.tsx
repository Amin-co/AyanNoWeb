"use client";

import { useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { useQuery } from "@tanstack/react-query";
import Container from "@/components/ui/Container";
import api from "@/lib/api";

type OrderItem = {
  itemId: string;
  name?: string;
  qty: number;
  unitPrice: number;
  variantName?: string;
  addOns?: { addOnId: string; name?: string; price: number }[];
};

type OrderDetail = {
  _id: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax?: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  address?: {
    label?: string;
    line1?: string;
    city?: string;
  };
  delivery?: {
    method: string;
    status?: string;
    slot?: {
      date?: string;
      window?: string;
    };
  };
  payment?: {
    method: string;
    status?: string;
  };
};

type OrderResponse = {
  success: boolean;
  data?: OrderDetail;
};

const createCurrencyFormatter = (locale: string) =>
  new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 0,
  });

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const locale = useLocale();
  const t = useTranslations("orders");
  const commonT = useTranslations("common");
  const router = useRouter();
  const currencyLabel = commonT("currency.toman");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem("token")) {
      router.replace("/auth");
    }
  }, [router]);

  const orderQuery = useQuery({
    queryKey: ["order-detail", orderId],
    enabled: Boolean(orderId),
    retry: false,
    queryFn: async () => {
      if (!orderId) {
        return null;
      }
      const { data } = await api.get<OrderResponse>(`/orders/${orderId}`);
      return data.data ?? null;
    },
  });

  const formatter = useMemo(() => createCurrencyFormatter(locale), [locale]);
  const isLoading = orderQuery.isPending;
  const order = orderQuery.data;
  const loadFailed = Boolean(orderQuery.error);
  const notFound = !isLoading && !order && !orderQuery.error;

  const summaryRows = order
    ? [
        { label: t("subtotal"), value: formatter.format(order.subtotal) },
        {
          label: t("discount"),
          value:
            order.discount > 0
              ? `-${formatter.format(order.discount)}`
              : formatter.format(order.discount),
        },
        { label: t("shipping"), value: formatter.format(order.shippingFee) },
        { label: t("tax"), value: formatter.format(order.tax ?? 0) },
        { label: t("total"), value: formatter.format(order.total), bold: true },
      ]
    : [];

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography component="h1" variant="h5" fontWeight={700}>
              {t("title")}{" "}
              {orderId ? (
                <Typography component="span" variant="h6" color="text.secondary">
                  #{orderId.slice(-6)}
                </Typography>
              ) : null}
            </Typography>
            <Button variant="text" onClick={() => router.push("/account")}>
              {t("back")}
            </Button>
          </Stack>

          {isLoading ? (
            <Stack alignItems="center" mt={6}>
              <CircularProgress />
            </Stack>
          ) : loadFailed ? (
            <Card>
              <CardContent>
                <Typography variant="body2" color="error">
                  {commonT("messages.loadFailed")}
                </Typography>
              </CardContent>
            </Card>
          ) : notFound ? (
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {t("empty")}
                </Typography>
              </CardContent>
            </Card>
          ) : order ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        {t("delivery")}
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          {t("method")}: {order.delivery?.method ?? "—"}
                        </Typography>
                        <Typography variant="body2">
                          {t("status")}: {order.delivery?.status ?? "—"}
                        </Typography>
                        <Typography variant="body2">
                          {t("window")}:{" "}
                          {order.delivery?.slot?.window
                            ? `${order.delivery.slot.window} (${new Date(
                                order.delivery.slot.date ?? "",
                              ).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US")})`
                            : "—"}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        {t("payment")}
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          {t("method")}: {order.payment?.method ?? "—"}
                        </Typography>
                        <Typography variant="body2">
                          {t("status")}: {order.payment?.status ?? "—"}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        {t("address")}
                      </Typography>
                      <Typography variant="body2">
                        {order.address?.label
                          ? `${order.address.label} – ${order.address.line1 ?? "—"}`
                          : order.address?.line1 ?? "—"}
                      </Typography>
                      {order.address?.city ? (
                        <Typography variant="body2" color="text.secondary">
                          {order.address.city}
                        </Typography>
                      ) : null}
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      {t("items")}
                    </Typography>
                    <Stack spacing={2}>
                      {order.items.map((item, index) => {
                        const addOns =
                          Array.isArray(item.addOns) && item.addOns.length > 0
                            ? item.addOns
                            : [];
                        const unitTotal = item.unitPrice * item.qty;
                        return (
                          <Box
                            key={`${item.itemId}-${index}`}
                            sx={{
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 2,
                              p: 2,
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {item.name ?? item.itemId}
                            </Typography>
                            {item.variantName ? (
                              <Typography variant="body2" color="text.secondary">
                                {item.variantName}
                              </Typography>
                            ) : null}
                            <Typography variant="body2" color="text.secondary">
                              {t("quantity")}: {item.qty}
                            </Typography>
                            {addOns.length > 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                {t("addOns")}:{" "}
                                {addOns
                                  .map((addon) =>
                                    addon.price
                                      ? `${addon.name ?? addon.addOnId} (+${formatter.format(
                                          addon.price,
                                        )} ${currencyLabel})`
                                      : addon.name ?? addon.addOnId,
                                  )
                                  .join(locale === "fa" ? "، " : ", ")}
                              </Typography>
                            ) : null}
                            <Typography variant="body2" fontWeight={600} mt={1}>
                              {formatter.format(unitTotal)} {currencyLabel}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      {t("summary")}
                    </Typography>
                    <Stack spacing={1.5}>
                      {summaryRows.map((row) => (
                        <Stack
                          key={row.label}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" color="text.secondary">
                            {row.label}
                          </Typography>
                          <Typography
                            variant={row.bold ? "subtitle1" : "body2"}
                            fontWeight={row.bold ? 700 : 400}
                          >
                            {row.value} {currencyLabel}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : null}
        </Stack>
      </Container>
    </main>
  );
}
