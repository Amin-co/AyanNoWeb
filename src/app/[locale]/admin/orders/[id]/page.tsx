"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import apiAdmin from "@/lib/apiAdmin";

type OrderStatus = "pending" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "canceled";

type OrderDetailItem = {
  itemId: string;
  name?: string;
  variantName?: string;
  qty: number;
  unitPrice: number;
  addOns?: Array<{ addOnId: string; name?: string; price: number }>;
  note?: string;
};

type OrderDetailResponse = {
  _id: string;
  orderCode?: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  payment: {
    method: string;
    status: string;
  };
  delivery: {
    method: "delivery" | "pickup";
    status: OrderStatus;
    slot?: {
      date?: string;
      window?: string;
    };
  };
  address?: {
    label?: string;
    line1: string;
    city?: string;
    contactName?: string;
    contactPhone?: string;
  };
  userId?: {
    phone?: string;
  };
  items: OrderDetailItem[];
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "canceled"],
  preparing: ["ready", "canceled"],
  ready: ["out_for_delivery", "canceled"],
  out_for_delivery: ["delivered", "canceled"],
  delivered: [],
  canceled: [],
};

const statusColor = (status: OrderStatus): "default" | "info" | "warning" | "success" | "error" => {
  switch (status) {
    case "delivered":
      return "success";
    case "canceled":
      return "default";
    case "preparing":
    case "ready":
      return "warning";
    case "out_for_delivery":
      return "info";
    default:
      return "info";
  }
};

const formatCurrency = (value: number, locale: string) =>
  new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    style: "currency",
    currency: "IRR",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";
  const t = useTranslations("admin");
  const locale = "fa";

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdmin.get(`/admin/orders/${orderId}`);
      const data: OrderDetailResponse | undefined = response.data?.data;
      setOrder(data ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("error");
      setError(message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const getStatusLabel = useCallback(
    (status: OrderStatus) => t(`orders.status.${status}` as const),
    [t],
  );

  const getMethodLabel = useCallback(
    (method: "delivery" | "pickup") => t(`orders.method.${method}` as const),
    [t],
  );

  const currentStatus: OrderStatus | undefined = order?.delivery?.status;
  const nextStatuses = useMemo<OrderStatus[]>(() => {
    if (!currentStatus) return [];
    return statusTransitions[currentStatus] ?? [];
  }, [currentStatus]);

  const handleStatusUpdate = async (nextStatus: OrderStatus) => {
    if (!orderId) return;
    setStatusUpdating(true);
    setError(null);
    try {
      await apiAdmin.patch(`/admin/orders/${orderId}/status`, { status: nextStatus });
      await fetchOrder();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("error");
      setError(message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!orderId) return;
    setLabelError(null);
    try {
      const response = await apiAdmin.post(`/admin/orders/${orderId}/labels`);
      const labelData = response.data?.data as {
        orderCode?: string;
        customer?: { phone?: string };
        address?: { line1?: string; city?: string };
        delivery?: { slot?: { date?: string; window?: string } };
        items?: Array<{ name?: string; variant?: string; qty: number }>;
      } | undefined;

      if (!labelData) {
        throw new Error("برچسبی دریافت نشد.");
      }

      const printWindow = window.open("", "_blank", "width=600,height=800");
      if (!printWindow) {
        throw new Error("امکان باز کردن پنجره چاپ وجود ندارد.");
      }

      printWindow.document.write(`
        <html dir="rtl" lang="fa">
          <head>
            <title>برچسب سفارش ${labelData.orderCode ?? ""}</title>
            <style>
              body { font-family: sans-serif; padding: 24px; }
              h1 { font-size: 20px; margin-bottom: 12px; }
              .section { margin-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #999; padding: 8px; font-size: 13px; text-align: right; }
            </style>
          </head>
          <body>
            <h1>برچسب سفارش ${labelData.orderCode ?? ""}</h1>
            <div class="section">
              <strong>مشتری:</strong> ${labelData.customer?.phone ?? "—"}<br/>
              <strong>آدرس:</strong> ${labelData.address?.line1 ?? "—"} ${labelData.address?.city ? `، ${labelData.address.city}` : ""}<br/>
              <strong>زمان تحویل:</strong> ${labelData.delivery?.slot?.date ?? "—"} ${labelData.delivery?.slot?.window ?? ""}
            </div>
            <div class="section">
              <strong>اقلام:</strong>
              <table>
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>تعداد</th>
                  </tr>
                </thead>
                <tbody>
                  ${(labelData.items ?? [])
                    .map(
                      (item) => `
                      <tr>
                        <td>${item.name ?? "—"}${item.variant ? ` (${item.variant})` : ""}</td>
                        <td>${item.qty}</td>
                      </tr>
                    `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطا در چاپ برچسب";
      setLabelError(message);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !order) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!order) {
    return <Alert severity="warning">سفارش پیدا نشد.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            سفارش {order.orderCode ?? order._id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ثبت شده در {new Date(order.createdAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { hour12: false })}
          </Typography>
        </Box>
        {currentStatus ? (
          <Chip label={getStatusLabel(currentStatus)} color={statusColor(currentStatus)} />
        ) : null}
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {labelError ? <Alert severity="error">{labelError}</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(0, 1fr)" },
        }}
      >
        <Box>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700}>
                {t("orders.detail.items")}
              </Typography>
            </CardContent>
            <Divider />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>عنوان</TableCell>
                      <TableCell>{t("orders.detail.addOns")}</TableCell>
                      <TableCell>{t("orders.detail.quantity")}</TableCell>
                      <TableCell>{t("orders.detail.unitPrice")}</TableCell>
                      <TableCell>{t("orders.detail.lineTotal")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item) => {
                      const addOnNames = (item.addOns ?? []).map((a) => a.name ?? "").filter(Boolean);
                      return (
                        <TableRow key={item.itemId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.name ?? item.itemId}
                            </Typography>
                            {item.variantName ? (
                              <Typography variant="caption" color="text.secondary">
                                {item.variantName}
                              </Typography>
                            ) : null}
                            {item.note ? (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {t("orders.detail.note")}: {item.note}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell>{addOnNames.length ? addOnNames.join("، ") : t("orders.detail.none")}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice, locale)}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice * item.qty, locale)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("orders.detail.totals")}
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t("orders.detail.subtotal")}
                    </Typography>
                    <Typography variant="body2">{formatCurrency(order.subtotal, locale)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t("orders.detail.discount")}
                    </Typography>
                    <Typography variant="body2">{formatCurrency(order.discount, locale)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t("orders.detail.shipping")}
                    </Typography>
                    <Typography variant="body2">{formatCurrency(order.shippingFee, locale)}</Typography>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body1" fontWeight={700}>
                      {t("orders.detail.payable")}
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {formatCurrency(order.total, locale)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("orders.detail.deliveryInfo")}
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{t("orders.detail.deliveryMethod")}:</strong> {order.delivery?.method ? getMethodLabel(order.delivery.method) : t("orders.detail.none")}
                  </Typography>
                  {order.delivery?.method === "delivery" ? (
                    <>
                      <Typography variant="body2">
                        <strong>{t("orders.detail.address")}:</strong> {order.address?.line1 ?? t("orders.detail.none")}
                      </Typography>
                      <Typography variant="body2">
                        <strong>{t("orders.detail.city")}:</strong> {order.address?.city ?? t("orders.detail.none")}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2">{t("orders.detail.deliveryPickup")}</Typography>
                  )}
                  <Typography variant="body2">
                    <strong>{t("orders.detail.deliveryWindow")}:</strong> {order.delivery?.slot?.date ? `${order.delivery.slot.date ?? ""} ${order.delivery?.slot?.window ?? ""}` : t("orders.detail.none")}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("orders.detail.payment")}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  روش: {order.payment.method} | وضعیت: {order.payment.status === "paid" ? "پرداخت شده" : "پرداخت نشده"}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("orders.detail.operations")}
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {nextStatuses.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {nextStatuses.map((nextStatus) => (
                        <Button
                          key={nextStatus}
                          variant="contained"
                          size="small"
                          disabled={statusUpdating}
                          onClick={() => handleStatusUpdate(nextStatus)}
                        >
                          {getStatusLabel(nextStatus)}
                        </Button>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t("orders.detail.noStatusChange")}
                    </Typography>
                  )}
                  <Button variant="outlined" onClick={handlePrintLabel}>
                    {t("orders.detail.printLabel")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
}
