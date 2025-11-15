"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useLocale, useTranslations } from "next-intl";
import apiAdmin from "@/lib/apiAdmin";

type DeliveryZone = {
  id: string;
  name: string;
  description?: string;
  minOrder?: number;
  shippingFee?: number;
  sortOrder?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ZoneFormState = {
  name: string;
  description: string;
  minOrder: string;
  shippingFee: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm: ZoneFormState = {
  name: "",
  description: "",
  minOrder: "",
  shippingFee: "",
  sortOrder: "",
  active: true,
};

const formatInputToNumber = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function AdminServiceAreaPage() {
  const t = useTranslations("admin.serviceAreas");
  const adminT = useTranslations("admin");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ZoneFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZone | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const currencyLabel = commonT("currency.toman");
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const formatAmount = (value?: number) => {
    if (typeof value !== "number") {
      return "-";
    }
    return `${formatter.format(value)} ${currencyLabel}`;
  };

  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiAdmin.get<{ success: boolean; data?: DeliveryZone[] }>("/admin/delivery/zones");
      setZones(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : adminT("error");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [adminT]);

  useEffect(() => {
    void fetchZones();
  }, [fetchZones]);

  const handleOpenCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setForm({
      name: zone.name ?? "",
      description: zone.description ?? "",
      minOrder: zone.minOrder ? String(zone.minOrder) : "",
      shippingFee: zone.shippingFee ? String(zone.shippingFee) : "",
      sortOrder: typeof zone.sortOrder === "number" ? String(zone.sortOrder) : "",
      active: zone.active,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleFormChange = (field: keyof ZoneFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setSnackbar({ open: true, severity: "error", message: t("messages.validation") });
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      minOrder: formatInputToNumber(form.minOrder),
      shippingFee: formatInputToNumber(form.shippingFee),
      sortOrder: formatInputToNumber(form.sortOrder),
      active: form.active,
    };

    setSaving(true);
    try {
      if (editingId) {
        const { data } = await apiAdmin.patch<{ success: boolean; data?: DeliveryZone }>(
          `/admin/delivery/zones/${editingId}`,
          payload,
        );
        const updatedZone = data?.data;
        if (updatedZone) {
          setZones((prev) => prev.map((zone) => (zone.id === editingId ? updatedZone : zone)));
        }
        setSnackbar({ open: true, severity: "success", message: adminT("success") });
      } else {
        const { data } = await apiAdmin.post<{ success: boolean; data?: DeliveryZone }>("/admin/delivery/zones", payload);
        if (data?.data) {
          setZones((prev) => [data.data!, ...prev]);
        }
        setSnackbar({ open: true, severity: "success", message: adminT("success") });
      }
      handleCloseDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : adminT("error");
      setSnackbar({ open: true, severity: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (zone: DeliveryZone) => {
    setDeleteTarget(zone);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteLoading(true);
    try {
      await apiAdmin.delete(`/admin/delivery/zones/${deleteTarget.id}`);
      setZones((prev) => prev.filter((zone) => zone.id !== deleteTarget.id));
      setSnackbar({ open: true, severity: "success", message: adminT("success") });
      handleCloseDeleteDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : adminT("error");
      setSnackbar({ open: true, severity: "error", message });
      setDeleteLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t("title")}
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleOpenCreateDialog}>
          {t("new")}
        </Button>
      </Stack>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : zones.length === 0 ? (
            <Typography align="center" color="text.secondary">
              {t("empty")}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("table.name")}</TableCell>
                    <TableCell>{t("table.description")}</TableCell>
                    <TableCell>{t("table.minOrder")}</TableCell>
                    <TableCell>{t("table.shippingFee")}</TableCell>
                    <TableCell>{t("table.sortOrder")}</TableCell>
                    <TableCell>{t("table.status")}</TableCell>
                    <TableCell align="right">{t("table.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell>
                        <Typography fontWeight={600}>{zone.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {zone.description || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatAmount(zone.minOrder)}</TableCell>
                      <TableCell>{formatAmount(zone.shippingFee)}</TableCell>
                      <TableCell>{zone.sortOrder ?? "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={zone.active ? adminT("forms.active") : adminT("forms.inactive")}
                          color={zone.active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title={adminT("forms.edit")}>
                            <IconButton size="small" onClick={() => handleOpenEditDialog(zone)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={adminT("forms.delete")}>
                            <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(zone)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? t("edit") : t("new")}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label={t("form.name")}
                value={form.name}
                onChange={(event) => handleFormChange("name", event.target.value)}
                required
                fullWidth
              />
              <TextField
                label={t("form.description")}
                value={form.description}
                onChange={(event) => handleFormChange("description", event.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label={t("form.minOrder")}
                value={form.minOrder}
                onChange={(event) => handleFormChange("minOrder", event.target.value)}
                type="number"
                fullWidth
              />
              <TextField
                label={t("form.shippingFee")}
                value={form.shippingFee}
                onChange={(event) => handleFormChange("shippingFee", event.target.value)}
                type="number"
                fullWidth
              />
              <TextField
                label={t("form.sortOrder")}
                value={form.sortOrder}
                onChange={(event) => handleFormChange("sortOrder", event.target.value)}
                type="number"
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.active}
                    onChange={(event) => handleFormChange("active", event.target.checked)}
                  />
                }
                label={t("form.active")}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{adminT("cancel")}</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={20} /> : adminT("save")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={handleCloseDeleteDialog}>
        <DialogTitle>{adminT("forms.delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("messages.deleteConfirm", { name: deleteTarget?.name ?? "" })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>{adminT("cancel")}</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading || !deleteTarget}>
            {deleteLoading ? <CircularProgress size={20} color="inherit" /> : adminT("forms.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
