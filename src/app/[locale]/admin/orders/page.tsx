"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/navigation";
import apiAdmin from "@/lib/apiAdmin";

type OrderListItem = {
  _id: string;
  orderCode: string;
  user?: { phone?: string | null } | null;
  total: number;
  delivery?: { method?: string | null } | null;
  status: string;
  createdAt: string;
};

type AdminOrdersListResponse = {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
};

const statusOptions = [
  "pending",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "canceled",
];

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

const formatDateTime = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", {
    hour12: false,
  });

export default function AdminOrdersPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fa";
  const t = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(() => {
    const current = Number(searchParams.get("page"));
    return Number.isFinite(current) && current > 0 ? current : 1;
  });
  const [limit, setLimit] = useState(() => {
    const current = Number(searchParams.get("limit"));
    return Number.isFinite(current) && current > 0 ? current : 20;
  });

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const appliedParams = useMemo(
    () => ({
      status: searchParams.get("status") ?? "",
      dateFrom: searchParams.get("dateFrom") ?? "",
      dateTo: searchParams.get("dateTo") ?? "",
      q: searchParams.get("q") ?? "",
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "20"),
    }),
    [searchParams],
  );

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await apiAdmin.get("/admin/orders", {
          params: {
            status: appliedParams.status || undefined,
            q: appliedParams.q || undefined,
            dateFrom: appliedParams.dateFrom || undefined,
            dateTo: appliedParams.dateTo || undefined,
            page: appliedParams.page,
            limit: appliedParams.limit,
          },
        });
        const data = response.data?.data as AdminOrdersListResponse;
        if (!active) return;
        setOrders(data?.items ?? []);
        setTotal(data?.total ?? 0);
      } catch (error) {
        if (!active) return;
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
    fetchOrders();
    return () => {
      active = false;
    };
  }, [appliedParams.dateFrom, appliedParams.dateTo, appliedParams.limit, appliedParams.page, appliedParams.q, appliedParams.status, t]);

  const updateQueryString = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== "" && value !== "undefined") {
        params.set(key, String(value));
      }
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    updateQueryString({
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      q: query || undefined,
      page: 1,
      limit,
    });
  };

  const handleResetFilters = () => {
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setQuery("");
    setPage(1);
    updateQueryString({ page: 1, limit });
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage + 1);
    updateQueryString({
      status: appliedParams.status || undefined,
      dateFrom: appliedParams.dateFrom || undefined,
      dateTo: appliedParams.dateTo || undefined,
      q: appliedParams.q || undefined,
      page: newPage + 1,
      limit,
    });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(1);
    updateQueryString({
      status: appliedParams.status || undefined,
      dateFrom: appliedParams.dateFrom || undefined,
      dateTo: appliedParams.dateTo || undefined,
      q: appliedParams.q || undefined,
      page: 1,
      limit: newLimit,
    });
  };

  return (
    <Stack spacing={4}>
      <Typography variant="h4" fontWeight={700}>
        {t("orders.title")}
      </Typography>

      <Card>
        <CardContent component="form" onSubmit={handleFilterSubmit}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            {t("orders.filterTitle")}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label={t("orders.filters.status")}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">{t("orders.filters.all")}</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                fullWidth
                label={t("orders.filters.dateFrom")}
                InputLabelProps={{ shrink: true }}
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                fullWidth
                label={t("orders.filters.dateTo")}
                InputLabelProps={{ shrink: true }}
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t("orders.filters.search")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button type="submit" variant="contained">
              {t("orders.filters.apply")}
            </Button>
            <Button variant="outlined" onClick={handleResetFilters}>
              {t("orders.filters.reset")}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("orders.table.code")}</TableCell>
                <TableCell>{t("orders.table.phone")}</TableCell>
                <TableCell>{t("orders.table.total")}</TableCell>
                <TableCell>{t("orders.table.method")}</TableCell>
                <TableCell>{t("orders.table.status")}</TableCell>
                <TableCell>{t("orders.table.createdAt")}</TableCell>
                <TableCell>{t("orders.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, rowIndex) => (
                    <TableRow key={`skeleton-${rowIndex}`}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderCode}</TableCell>
                      <TableCell>{order.user?.phone ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(order.total ?? 0, locale)}</TableCell>
                      <TableCell>{order.delivery?.method ?? "delivery"}</TableCell>
                      <TableCell>
                        <Chip label={order.status} color={statusColor(order.status)} size="small" />
                      </TableCell>
                      <TableCell>{formatDateTime(order.createdAt, locale)}</TableCell>
                      <TableCell>
                        <Button component={Link} href={`/admin/orders/${order._id}`} size="small">
                          {t("orders.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {t("orders.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={limit}
          rowsPerPageOptions={[10, 20, 50]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
