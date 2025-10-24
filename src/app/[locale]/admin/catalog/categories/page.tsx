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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
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
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MuiAlert from "@mui/material/Alert";
import { useTranslations } from "next-intl";
import apiAdmin from "@/lib/apiAdmin";

type Category = {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  order?: number;
  active?: boolean;
};

type CategoryFormState = {
  id?: string;
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>(
    { open: false, message: "", severity: "success" },
  );

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdmin.get("/admin/catalog/categories");
      const data: Category[] = response.data?.data ?? [];
      setCategories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("error");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const parentOptions = useMemo(
    () => categories.map((cat) => ({ value: cat._id, label: cat.name })),
    [categories],
  );

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setForm({
        id: category._id,
        name: category.name ?? "",
        slug: category.slug ?? "",
        parentId: category.parentId ?? "",
        order: category.order?.toString() ?? "",
        active: category.active ?? true,
        seoTitle: "",
        seoDesc: "",
      });
    } else {
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleChange = (field: keyof CategoryFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        parentId: form.parentId || undefined,
        order: form.order ? Number(form.order) : undefined,
        active: form.active,
        seo: {
          title: form.seoTitle.trim() || undefined,
          desc: form.seoDesc.trim() || undefined,
        },
      };

      if (!payload.name) {
        throw new Error(`${t("forms.name")} الزامی است.`);
      }

      if (form.id) {
        await apiAdmin.patch(`/admin/catalog/categories/${form.id}`, payload);
      } else {
        await apiAdmin.post("/admin/catalog/categories", payload);
      }

      setSnackbar({ open: true, message: t("success"), severity: "success" });
      await fetchCategories();
      handleCloseDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("error");
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("آیا از حذف این دسته مطمئن هستید؟")) return;
    try {
      await apiAdmin.delete(`/admin/catalog/categories/${id}`);
      setSnackbar({ open: true, message: t("success"), severity: "success" });
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("error");
      setSnackbar({ open: true, message, severity: "error" });
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" fontWeight={700}>
            {t("categories.title")}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            {t("forms.newCategory")}
          </Button>
        </CardContent>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("forms.name")}</TableCell>
                    <TableCell>{t("forms.slug")}</TableCell>
                    <TableCell>{t("forms.parent")}</TableCell>
                    <TableCell>{t("forms.order")}</TableCell>
                    <TableCell>{t("forms.active")}</TableCell>
                    <TableCell align="left">{t("forms.edit")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id} hover>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>
                        {categories.find((cat) => cat._id === category.parentId)?.name ?? "—"}
                      </TableCell>
                      <TableCell>{category.order ?? "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={category.active ? "فعال" : "غیرفعال"}
                          color={category.active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button color="primary" onClick={() => handleOpenDialog(category)}>
                            <EditIcon fontSize="small" />
                          </Button>
                          <Button color="error" onClick={() => handleDelete(category._id)}>
                            <DeleteIcon fontSize="small" />
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        دسته‌ای یافت نشد.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? t("forms.edit") : t("forms.create")}</DialogTitle>
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
                  value={form.parentId}
                  label={t("forms.parent")}
                  onChange={(event) => handleChange("parentId", event.target.value as string)}
                >
                  <MenuItem value="">
                    <em>—</em>
                  </MenuItem>
                  {parentOptions
                    .filter((option) => option.value !== form.id)
                    .map((option) => (
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
                control={
                  <Switch
                    checked={form.active}
                    onChange={(event) => handleChange("active", event.target.checked)}
                  />
                }
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
              {saving ? "در حال ذخیره..." : t("forms.save")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Stack>
  );
};

export default AdminCatalogCategoriesPage;
