"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AlertColor } from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import apiAdmin from "@/lib/apiAdmin";

type OrderStatus = "pending" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "canceled";

type OrderDetailItem = {
  itemId?: string;
  name?: string;
  variant?: string | null;
  variantName?: string | null;
  qty: number;
  unitPrice: number;
  addOns?: Array<{ addOnId?: string; name?: string | null }>;
  note?: string | null;
};

type OrderDetailResponse = {
  _id: string;
  orderCode?: string;
  status?: OrderStatus;
  createdAt: string;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  total?: number;
  payment?: {
    method?: string | null;
    status?: string | null;
  };
  user?: {
    phone?: string | null;
  };
  userId?: {
    phone?: string | null;
  };
  address?: {
    label?: string | null;
    line1?: string | null;
    city?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
  };
  delivery?: {
    method?: "delivery" | "pickup";
    status?: OrderStatus;
    slot?: {
      date?: string | null;
      window?: string | null;
    };
    address?: {
      label?: string | null;
      line1?: string | null;
      city?: string | null;
      contactName?: string | null;
      contactPhone?: string | null;
    };
  };
  items?: OrderDetailItem[];
};

type PrintLabelPayload = {
  orderCode?: string;
  customerPhone?: string;
  addressSummary?: string;
  createdAt?: string;
  items?: Array<{ name?: string; qty: number }>;
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "canceled"],
  preparing: ["ready", "canceled"],
  ready: ["out_for_delivery", "canceled"],
  out_for_delivery: ["delivered", "canceled"],
  delivered: [],
  canceled: [],
};

const statusColor = (status: OrderStatus): "default" | "info" | "warning" | "success" => {
  switch (status) {
    case "pending":
      return "info";
    case "preparing":
    case "ready":
      return "warning";
    case "out_for_delivery":
      return "info";
    case "delivered":
      return "success";
    case "canceled":
    default:
      return "default";
  }
};

const formatCurrency = (value: number | undefined, locale: string) =>
  new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    style: "currency",
    currency: "IRR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDateTime = (value: string | undefined, locale: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", {
    hour12: false,
  });
};

const normalizeParam = (value: string | string[] | undefined, fallback = ""): string => {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const locale = normalizeParam(params?.locale, "fa");
  const orderId = normalizeParam(params?.id);
  const t = useTranslations("admin");

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusValue, setStatusValue] = useState<OrderStatus | "">("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = useCallback((message: string, severity: AlertColor = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const response = await apiAdmin.get(`/admin/orders/${orderId}`);
      const data: OrderDetailResponse | undefined = response.data?.data ?? response.data;
      setOrder(data ?? null);
      const incomingStatus = (data?.status ?? data?.delivery?.status) as OrderStatus | undefined;
      setStatusValue(incomingStatus ?? "");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("error");
      setOrder(null);
      showSnackbar(message, "error");
    } finally {
      setLoading(false);
    }
  }, [orderId, showSnackbar, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const currentStatus = (order?.status ?? order?.delivery?.status ?? "") as OrderStatus | "";

  const statusChoices = useMemo<OrderStatus[]>(() => {
    if (!currentStatus) return [];
    const uniqueStatuses = new Set<OrderStatus>([currentStatus, ...(statusTransitions[currentStatus] ?? [])]);
    return Array.from(uniqueStatuses);
  }, [currentStatus]);

  const getStatusLabel = useCallback(
    (status: OrderStatus) => t(`orders.statusLabels.${status}` as const),
    [t],
  );

  const paymentStatusLabels = useMemo(
    () => ({
      paid: t("orders.detail.paymentStatus.paid"),
      pending: t("orders.detail.paymentStatus.pending"),
      failed: t("orders.detail.paymentStatus.failed"),
      refunded: t("orders.detail.paymentStatus.refunded"),
    }),
    [t],
  );

  const handleStatusSelect = async (event: SelectChangeEvent<OrderStatus>) => {
    if (!orderId || !currentStatus) return;
    const nextStatus = event.target.value as OrderStatus;
    setStatusValue(nextStatus);

    if (nextStatus === currentStatus) {
      return;
    }

    setStatusSaving(true);
    try {
      await apiAdmin.patch(`/admin/orders/${orderId}/status`, { status: nextStatus });
      showSnackbar(t("orders.detail.statusUpdated"), "success");
      await fetchOrder();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("error");
      showSnackbar(message, "error");
      setStatusValue(currentStatus);
    } finally {
      setStatusSaving(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!orderId) return;
    setPrintLoading(true);
    try {
      const response = await apiAdmin.post(`/admin/orders/${orderId}/print-label`);
      const payload: PrintLabelPayload | undefined = response.data?.data ?? response.data;
      if (!payload) {
        throw new Error(t("error"));
      }

      if (typeof window === "undefined") {
        showSnackbar(t("error"), "error");
        return;
      }

      const printWindow = window.open("", "_blank", "width=600,height=800");
      if (!printWindow) {
        throw new Error(t("error"));
      }

      const rows =
        payload.items?.map(
          (item) => `
            <tr>
              <td>${item.name ?? "-"}</td>
              <td style="text-align:center;">${item.qty}</td>
            </tr>
          `,
        ).join("") ?? "";

      printWindow.document.write(`
        <html dir="rtl" lang="fa">
          <head>
            <title>${t("orders.detail.printLabel")} ${payload.orderCode ?? ""}</title>
            <style>
              body { font-family: sans-serif; padding: 24px; }
              h1 { font-size: 20px; margin-bottom: 16px; }
              .section { margin-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #999; padding: 8px; font-size: 13px; text-align: right; }
              th { background: #f5f5f5; }
            </style>
          </head>
          <body>
            <h1>${t("orders.detail.printLabel")} ${payload.orderCode ?? ""}</h1>
            <div class="section">
              <div><strong>${t("orders.table.customer")}:</strong> ${payload.customerPhone ?? "—"}</div>
              <div><strong>${t("orders.detail.address")}:</strong> ${payload.addressSummary ?? "—"}</div>
              <div><strong>${t("orders.table.createdAt")}:</strong> ${payload.createdAt ?? "—"}</div>
            </div>
            <div class="section">
              <table>
                <thead>
                  <tr>
                    <th>${t("forms.name")}</th>
                    <th style="text-align:center;">${t("orders.detail.quantity")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      showSnackbar(t("success"), "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("error");
      showSnackbar(message, "error");
    } finally {
      setPrintLoading(false);
    }
  };

  const customerPhone = order?.user?.phone ?? order?.userId?.phone ?? "—";
  const deliveryAddress = order?.delivery?.address ?? order?.address;
  const addressText =
    deliveryAddress?.line1 || deliveryAddress?.city
      ? [deliveryAddress?.label, deliveryAddress?.line1, deliveryAddress?.city].filter(Boolean).join("، ")
      : t("orders.detail.none");

  const slotText = order?.delivery?.slot?.date
    ? `${new Date(order.delivery.slot.date).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US")} ${
        order.delivery.slot.window ?? ""
      }`.trim()
    : t("orders.detail.none");

  const paymentStatusText =
    order?.payment?.status && paymentStatusLabels[order.payment.status as keyof typeof paymentStatusLabels]
      ? paymentStatusLabels[order.payment.status as keyof typeof paymentStatusLabels]
      : order?.payment?.status ?? t("orders.detail.none");

  const summaryCard = (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700}>
          {t("orders.detail.summary")}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              {t("orders.table.code")}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {order?.orderCode ?? order?._id}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              {t("orders.table.createdAt")}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatDateTime(order?.createdAt, locale)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              {t("orders.detail.payment")}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {order?.payment?.method ?? t("orders.detail.none")}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              {t("orders.detail.paymentStatusLabel")}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {paymentStatusText}
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t("orders.detail.subtotal")}
            </Typography>
            <Typography variant="body2">{formatCurrency(order?.subtotal, locale)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t("orders.detail.discount")}
            </Typography>
            <Typography variant="body2">{formatCurrency(order?.discount, locale)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t("orders.detail.shipping")}
            </Typography>
            <Typography variant="body2">{formatCurrency(order?.shippingFee, locale)}</Typography>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body1" fontWeight={700}>
              {t("orders.detail.payable")}
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {formatCurrency(order?.total, locale)}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  const customerCard = (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700}>
          {t("orders.detail.deliveryInfo")}
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>{t("orders.table.customer")}:</strong> {customerPhone}
          </Typography>
          <Typography variant="body2">
            <strong>{t("orders.detail.deliveryMethod")}:</strong>{" "}
            {order?.delivery?.method ? t(`orders.method.${order.delivery.method}` as const) : t("orders.detail.none")}
          </Typography>
          {order?.delivery?.method === "pickup" ? (
            <Typography variant="body2">{t("orders.detail.deliveryPickup")}</Typography>
          ) : (
            <>
              <Typography variant="body2">
                <strong>{t("orders.detail.address")}:</strong> {addressText}
              </Typography>
              {deliveryAddress?.contactName ? (
                <Typography variant="body2" color="text.secondary">
                  {deliveryAddress.contactName}
                  {deliveryAddress.contactPhone ? ` - ${deliveryAddress.contactPhone}` : ""}
                </Typography>
              ) : null}
            </>
          )}
          <Typography variant="body2">
            <strong>{t("orders.detail.deliveryWindow")}:</strong> {slotText}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );

  const statusCard = (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700}>
          {t("orders.detail.operations")}
        </Typography>
        {statusChoices.length > 0 ? (
          <TextField
            select
            fullWidth
            label={t("orders.status")}
            size="small"
            sx={{ mt: 2 }}
            value={statusValue || ""}
            onChange={(event) => {
              void handleStatusSelect(event as SelectChangeEvent<OrderStatus>);
            }}
            disabled={statusSaving}
            helperText={t("orders.detail.changeStatus")}
          >
            {statusChoices.map((status) => (
              <MenuItem key={status} value={status}>
                {getStatusLabel(status)}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t("orders.detail.noStatusChange")}
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <Button variant="outlined" fullWidth onClick={handlePrintLabel} disabled={printLoading}>
          {printLoading ? <CircularProgress size={18} /> : t("orders.detail.printLabel")}
        </Button>
      </CardContent>
    </Card>
  );

  const itemsCard = (
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
                <TableCell>{t("forms.name")}</TableCell>
                <TableCell>{t("items.fields.variantName")}</TableCell>
                <TableCell>{t("orders.detail.addOns")}</TableCell>
                <TableCell>{t("orders.detail.quantity")}</TableCell>
                <TableCell>{t("orders.detail.unitPrice")}</TableCell>
                <TableCell>{t("orders.detail.lineTotal")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(order?.items ?? []).length > 0 ? (
                (order?.items ?? []).map((item, index) => {
                  const addOnNames = (item.addOns ?? []).map((addon) => addon.name).filter(Boolean);
                  return (
                    <TableRow key={item.itemId ?? `${item.name ?? ""}-${index}`}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.name ?? t("orders.detail.none")}
                        </Typography>
                        {item.note ? (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {t("orders.detail.note")}: {item.note}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{item.variant ?? item.variantName ?? t("orders.detail.none")}</TableCell>
                      <TableCell>{addOnNames.length ? addOnNames.join("، ") : t("orders.detail.none")}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice, locale)}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice * item.qty, locale)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {t("orders.detail.noItems")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const loadingSkeleton = (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box sx={{ flex: "1 1 auto" }}>
          <Skeleton variant="text" width={240} height={32} />
          <Skeleton variant="text" width={180} height={20} />
        </Box>
        <Skeleton variant="rounded" width={120} height={36} />
      </Stack>
      <Card>
        <CardContent>
          <Skeleton variant="text" width={160} height={24} />
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={12} md={6} key={`summary-skeleton-${index}`}>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="50%" />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={180} height={24} />
            </CardContent>
            <Divider />
            <CardContent>
              <Table>
                <TableBody>
                  {Array.from({ length: 4 }).map((_, rowIndex) => (
                    <TableRow key={`loading-row-${rowIndex}`}>
                      {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <TableCell key={`loading-cell-${rowIndex}-${cellIndex}`}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {[1, 2].map((card) => (
              <Card key={`side-card-${card}`}>
                <CardContent>
                  <Skeleton variant="text" width={140} height={24} />
                  {Array.from({ length: 4 }).map((_, line) => (
                    <Skeleton key={`side-line-${line}`} variant="text" width={`${80 - line * 10}%`} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </>
  );

  return (
    <Stack spacing={3}>
      {loading ? (
        loadingSkeleton
      ) : order ? (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {t("orders.detail.summary")} {order.orderCode ?? order._id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("orders.table.createdAt")}: {formatDateTime(order.createdAt, locale)}
              </Typography>
            </Box>
            {currentStatus ? (
              <Chip label={getStatusLabel(currentStatus)} color={statusColor(currentStatus)} />
            ) : null}
          </Stack>
          {summaryCard}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {itemsCard}
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {customerCard}
                {statusCard}
              </Stack>
            </Grid>
          </Grid>
        </>
      ) : (
        <Alert severity="warning">{t("orders.detail.noItems")}</Alert>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
