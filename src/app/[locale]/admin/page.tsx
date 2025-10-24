"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useParams, Link } from "@/navigation";
import apiAdmin from "@/lib/apiAdmin";

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
  pagination: {
    totalItems: number;
  };
  totals: {
    totalOrders: number;
    totalAmount: number;
  };
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

const formatCurrency = (value: number, locale: string) => {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    style: "currency",
    currency: "IRR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function AdminHomePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fa";
  const t = useTranslations("admin");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminOrdersResponse | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const dateFrom = new Date(now);
        dateFrom.setHours(0, 0, 0, 0);
        const dateTo = new Date(now);
        dateTo.setHours(23, 59, 59, 999);

        const response = await apiAdmin.get("/admin/orders", {
          params: {
            dateFrom: dateFrom.toISOString(),
            dateTo: dateTo.toISOString(),
            limit: 10,
            page: 1,
          },
        });

        const payload = response.data?.data;
        setData(payload ?? null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "خطا در دریافت اطلاعات داشبورد";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const kpis = useMemo(() => {
    const totalOrders = data?.totals?.totalOrders ?? 0;
    const totalSales = data?.totals?.totalAmount ?? 0;
    return [
      {
        label: "تعداد سفارش‌های امروز",
        value: totalOrders ? totalOrders.toLocaleString(locale === "fa" ? "fa-IR" : "en-US") : "۰",
      },
      {
        label: "مجموع فروش امروز",
        value: formatCurrency(totalSales, locale),
      },
      {
        label: "درصد تحویل به موقع",
        value: "—",
      },
      {
        label: "ظرفیت باز بازه‌های تحویل",
        value: "—",
      },
    ];
  }, [data, locale]);

  const latestOrders = data?.items ?? [];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "50vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Typography variant="h4" fontWeight={700} sx={{ color: goldColor }}>
        {t("home.title")}
      </Typography>

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : null}

      <Grid container spacing={3}>
        {kpis.map((item) => (
          <Grid item xs={12} md={3} key={item.label}>
            <Card
              sx={{
                borderTop: `4px solid ${goldColor}`,
                bgcolor: "background.paper",
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: goldColor, mt: 1 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              {t("orders.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {latestOrders.length > 0
                ? "۱۰ سفارش اخیر امروز"
                : "سفارشی برای امروز ثبت نشده است."}
            </Typography>
          </div>
          <Button component={Link} href="/admin/orders" variant="outlined" sx={{ borderColor: goldColor }}>
            مشاهده همه
          </Button>
        </CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>کد سفارش</TableCell>
                <TableCell>مشتری</TableCell>
                <TableCell>تاریخ</TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell>جمع</TableCell>
                <TableCell align="left">جزئیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {latestOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.orderCode}</TableCell>
                  <TableCell>{order.user?.phone ?? "—"}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleString(
                      locale === "fa" ? "fa-IR" : "en-US",
                      { hour12: false },
                    )}
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
              {latestOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    هیچ سفارشی برای نمایش وجود ندارد.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}
