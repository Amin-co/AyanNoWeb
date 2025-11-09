"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/navigation";
import apiAdmin from "@/lib/apiAdmin";

type KpiResponse = {
  ordersCount: number;
  salesTotal: number;
};

type AdminOrdersResponse = {
  items: Array<{
    id: string;
    orderCode: string;
    createdAt: string;
    status: string;
    total: number;
    user?: {
      phone?: string | null;
    } | null;
  }>;
};

const goldColor = "#D4AF37";

const statusColor = (status: string): "default" | "info" | "warning" | "success" | "error" => {
  switch (status) {
    case "preparing":
    case "ready":
      return "warning";
    case "out_for_delivery":
      return "info";
    case "delivered":
      return "success";
    case "canceled":
      return "default";
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

export default function AdminHomePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fa";
  const t = useTranslations("admin");

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrdersResponse["items"]>([]);
  const [kpi, setKpi] = useState<KpiResponse>({ ordersCount: 0, salesTotal: 0 });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [kpiResponse, ordersResponse] = await Promise.all([
          apiAdmin.get("/admin/kpi/today"),
          apiAdmin.get("/admin/orders", { params: { limit: 10, page: 1 } }),
        ]);

        if (!active) {
          return;
        }

        setKpi(kpiResponse.data?.data ?? { ordersCount: 0, salesTotal: 0 });
        setOrders(ordersResponse.data?.data?.items ?? []);
      } catch (error) {
        if (!active) {
          return;
        }
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (error instanceof Error ? error.message : t("error"));
        setSnackbar({ open: true, message });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();
    return () => {
      active = false;
    };
  }, [t]);

  const kpis = useMemo(
    () => [
      {
        label: t("kpi.ordersToday"),
        value: kpi.ordersCount.toLocaleString(locale === "fa" ? "fa-IR" : "en-US"),
      },
      {
        label: t("kpi.salesToday"),
        value: formatCurrency(kpi.salesTotal, locale),
      },
    ],
    [kpi.ordersCount, kpi.salesTotal, locale, t],
  );

  return (
    <Stack spacing={4}>
      <Typography variant="h4" fontWeight={700} sx={{ color: goldColor }}>
        {t("home.title")}
      </Typography>

      <Grid container spacing={3}>
        {kpis.map((item) => (
          <Grid item xs={12} md={6} key={item.label}>
            <Card
              sx={{
                borderTop: `4px solid ${goldColor}`,
                bgcolor: "background.paper",
                minHeight: 120,
                display: "flex",
                alignItems: "center",
              }}
            >
              <CardContent sx={{ width: "100%" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {item.label}
                </Typography>
                {loading ? (
                  <Skeleton variant="text" height={48} sx={{ mt: 1 }} />
                ) : (
                  <Typography variant="h4" fontWeight={800} sx={{ color: goldColor, mt: 1 }}>
                    {item.value}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {t("orders.latest")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("orders.subtitle")}
            </Typography>
          </Box>
          <Button component={Link} href="/admin/orders" variant="outlined" sx={{ borderColor: goldColor }}>
            {t("orders.viewAll")}
          </Button>
        </CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("orders.table.code")}</TableCell>
                <TableCell>{t("orders.table.phone")}</TableCell>
                <TableCell>{t("orders.table.createdAt")}</TableCell>
                <TableCell>{t("orders.table.status")}</TableCell>
                <TableCell>{t("orders.table.total")}</TableCell>
                <TableCell align="left">{t("orders.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, rowIndex) => (
                    <TableRow key={`skeleton-${rowIndex}`}>
                      {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderCode}</TableCell>
                      <TableCell>{order.user?.phone ?? "—"}</TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", {
                          hour12: false,
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={statusColor(order.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(order.total ?? 0, locale)}</TableCell>
                      <TableCell>
                        <Button component={Link} href={`/admin/orders/${order.id}`} size="small">
                          {t("orders.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {t("orders.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
