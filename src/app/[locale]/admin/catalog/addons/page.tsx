"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import apiAdmin from "@/lib/apiAdmin";
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
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

type Addon = {
  _id: string;
  name: string;
  group?: string | null;
  price?: number | null;
  active?: boolean;
};

type AddonFormState = {
  name: string;
  group: string;
  price: string;
  active: boolean;
};

const emptyForm: AddonFormState = {
  name: "",
  group: "",
  price: "",
  active: true,
};

const AdminCatalogAddOnsPage = () => {
  const t = useTranslations("admin");
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddonFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Addon | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchAddons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdmin.get("/admin/catalog/addons");
      const data: Addon[] = response.data?.data ?? [];
      setAddons(data);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : t("error");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const handleChange = (field: keyof AddonFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (addon: Addon) => {
    setEditingId(addon._id);
    setForm({
      name: addon.name ?? "",
      group: addon.group ?? "",
      price: typeof addon.price === "number" ? addon.price.toString() : "",
      active: addon.active ?? true,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      group: form.group || undefined,
      price: form.price ? Number(form.price) : 0,
      active: form.active,
    };
    try {
      if (editingId) {
        await apiAdmin.patch(`/admin/catalog/addons/${editingId}`, payload);
      } else {
        await apiAdmin.post("/admin/catalog/addons", payload);
      }
      await fetchAddons();
      setSnackbar({ open: true, severity: "success", message: t("success") });
      handleCloseDialog();
    } catch (submitError) {
      console.error(submitError);
      setSnackbar({ open: true, severity: "error", message: t("error") });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (addon: Addon) => {
    setDeleteTarget(addon);
    setDeleteLoading(false);
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
      await apiAdmin.delete(`/admin/catalog/addons/${deleteTarget._id}`);
      await fetchAddons();
      setSnackbar({ open: true, severity: "success", message: t("success") });
      handleCloseDeleteDialog();
    } catch (deleteError) {
      console.error(deleteError);
      setSnackbar({ open: true, severity: "error", message: t("error") });
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));
  const isEditMode = Boolean(editingId);

  const formatPrice = useMemo(
    () => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }),
    [],
  );

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">{t("addons.title")}</Typography>
        <Button variant="contained" onClick={handleOpenCreateDialog}>
          {t("forms.newAddon")}
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
          ) : addons.length === 0 ? (
            <Typography align="center" color="text.secondary">
              هنوز هیچ افزودنی ثبت نشده است.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("forms.name")}</TableCell>
                    <TableCell>{t("forms.group")}</TableCell>
                    <TableCell>{t("forms.price")}</TableCell>
                    <TableCell>{t("forms.active")}</TableCell>
                    <TableCell align="right">{t("orders.column.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {addons.map((addon) => (
                    <TableRow key={addon._id}>
                      <TableCell>{addon.name}</TableCell>
                      <TableCell>{addon.group || "-"}</TableCell>
                      <TableCell>
                        {typeof addon.price === "number" ? formatPrice.format(addon.price) : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={addon.active ? t("forms.active") : t("forms.inactive")}
                          color={addon.active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title={t("forms.edit")}>
                            <IconButton size="small" onClick={() => handleOpenEditDialog(addon)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("forms.delete")}>
                            <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(addon)}>
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
        <DialogTitle>{isEditMode ? t("forms.edit") : t("forms.newAddon")}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label={t("forms.name")}
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                required
                fullWidth
              />
              <TextField
                label={t("forms.group")}
                value={form.group}
                onChange={(event) => handleChange("group", event.target.value)}
                fullWidth
              />
              <TextField
                label={t("forms.price")}
                type="number"
                value={form.price}
                onChange={(event) => handleChange("price", event.target.value)}
                fullWidth
              />
              <FormControlLabel
                control={<Switch checked={form.active} onChange={(event) => handleChange("active", event.target.checked)} />}
                label={t("forms.active")}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t("forms.cancel")}</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {t("forms.save")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={handleCloseDeleteDialog}>
        <DialogTitle>{t("forms.delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`آیا از حذف "${deleteTarget?.name ?? ""}" مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>{t("forms.cancel")}</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading || !deleteTarget}>
            {t("forms.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default AdminCatalogAddOnsPage;
