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
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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

type Category = {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  order?: number;
  active?: boolean;
  seoTitle?: string;
  seoDesc?: string;
};

type CategoryFormState = {
  name: string;
  slug: string;
  parentId: string;
  order: string;
  active: boolean;
  seoTitle: string;
  seoDesc: string;
};

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  parentId: "",
  order: "",
  active: true,
  seoTitle: "",
  seoDesc: "",
};

const AdminCatalogCategoriesPage = () => {
  const t = useTranslations("admin");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdmin.get("/admin/catalog/categories");
      const data: Category[] = response.data?.data ?? [];
      setCategories(data);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : t("error");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const parentOptions = useMemo(
    () =>
      categories
        .filter((category) => category._id !== editingId)
        .map((category) => ({ value: category._id, label: category.name })),
    [categories, editingId],
  );

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category._id, category.name);
    });
    return map;
  }, [categories]);

  const handleChange = (field: keyof CategoryFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (category: Category) => {
    setEditingId(category._id);
    setForm({
      name: category.name ?? "",
      slug: category.slug ?? "",
      parentId: category.parentId ?? "",
      order: category.order?.toString() ?? "",
      active: category.active ?? true,
      seoTitle: category.seoTitle ?? "",
      seoDesc: category.seoDesc ?? "",
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
      slug: form.slug,
      parentId: form.parentId || undefined,
      order: form.order ? Number(form.order) : undefined,
      active: form.active,
      seoTitle: form.seoTitle,
      seoDesc: form.seoDesc,
    };

    try {
      if (editingId) {
        await apiAdmin.patch(`/admin/catalog/categories/${editingId}`, payload);
      } else {
        await apiAdmin.post("/admin/catalog/categories", payload);
      }
      await fetchCategories();
      setSnackbar({ open: true, severity: "success", message: t("success") });
      handleCloseDialog();
    } catch (submitError) {
      console.error(submitError);
      setSnackbar({ open: true, severity: "error", message: t("error") });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (category: Category) => {
    setDeleteTarget(category);
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
      await apiAdmin.delete(`/admin/catalog/categories/${deleteTarget._id}`);
      await fetchCategories();
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

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">{t("categories.title")}</Typography>
        <Button variant="contained" onClick={handleOpenCreateDialog}>
          {t("forms.newCategory")}
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
          ) : categories.length === 0 ? (
            <Typography align="center" color="text.secondary">
              هنوز هیچ دسته‌ای ثبت نشده است.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("forms.name")}</TableCell>
                    <TableCell>{t("forms.slug")}</TableCell>
                    <TableCell>{t("forms.parent")}</TableCell>
                    <TableCell>{t("forms.order")}</TableCell>
                    <TableCell>{t("forms.active")}</TableCell>
                    <TableCell align="right">{t("orders.column.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>{category.parentId ? parentNameMap.get(category.parentId) ?? "-" : "-"}</TableCell>
                      <TableCell>{category.order ?? "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={category.active ? t("forms.active") : t("forms.inactive")}
                          color={category.active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title={t("forms.edit")}>
                            <IconButton size="small" onClick={() => handleOpenEditDialog(category)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("forms.delete")}>
                            <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(category)}>
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
        <DialogTitle>{isEditMode ? t("forms.edit") : t("forms.newCategory")}</DialogTitle>
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
                label={t("forms.slug")}
                value={form.slug}
                onChange={(event) => handleChange("slug", event.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="parent-label">{t("forms.parent")}</InputLabel>
                <Select
                  labelId="parent-label"
                  label={t("forms.parent")}
                  value={form.parentId}
                  onChange={(event) => handleChange("parentId", event.target.value)}
                >
                  <MenuItem value="">
                    <em>-</em>
                  </MenuItem>
                  {parentOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={t("forms.order")}
                type="number"
                value={form.order}
                onChange={(event) => handleChange("order", event.target.value)}
                fullWidth
              />
              <FormControlLabel
                control={<Switch checked={form.active} onChange={(event) => handleChange("active", event.target.checked)} />}
                label={t("forms.active")}
              />
              <TextField
                label={t("forms.seoTitle")}
                value={form.seoTitle}
                onChange={(event) => handleChange("seoTitle", event.target.value)}
                fullWidth
              />
              <TextField
                label={t("forms.seoDesc")}
                value={form.seoDesc}
                onChange={(event) => handleChange("seoDesc", event.target.value)}
                fullWidth
                multiline
                minRows={2}
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

export default AdminCatalogCategoriesPage;
