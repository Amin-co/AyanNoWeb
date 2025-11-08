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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

type CatalogItem = {
  _id: string;
  name: string;
  price?: number | null;
  active?: boolean;
  updatedAt?: string;
  categoryIds?: string[];
  categories?: Array<{ _id?: string; id?: string; name?: string } | string>;
  images?: string[];
  description?: string;
  variants?: Array<{ name?: string; priceDiff?: number | null }>;
  addOnGroups?: Array<{
    group?: string;
    min?: number | null;
    max?: number | null;
    required?: boolean;
    addOnIds?: string[];
  }>;
};

type CategoryOption = {
  _id: string;
  name: string;
};

type AddOnOption = {
  _id: string;
  name: string;
  group?: string | null;
};

type ItemFormState = {
  name: string;
  price: string;
  categories: string[];
  images: string;
  description: string;
  active: boolean;
  variants: Array<{
    name: string;
    priceDiff: string;
  }>;
  addOnGroups: Array<{
    group: string;
    min: string;
    max: string;
    required: boolean;
    addOnIds: string[];
  }>;
};

const PAGE_SIZE = 20;
const emptyForm: ItemFormState = {
  name: "",
  price: "",
  categories: [],
  images: "",
  description: "",
  active: true,
  variants: [],
  addOnGroups: [],
};

const AdminCatalogItemsPage = () => {
  const t = useTranslations("admin");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [addOns, setAddOns] = useState<AddOnOption[]>([]);
  const [addOnsLoading, setAddOnsLoading] = useState(false);
  const [addOnsError, setAddOnsError] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogTab, setDialogTab] = useState<"details" | "variants" | "addons">("details");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const successToast = t("success");
  const errorToast = t("error");
  const validationToast = t("items.messages.validation");

  const formatPrice = useMemo(
    () => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }),
    [],
  );

  const formatDate = useCallback((value?: string) => {
    if (!value) {
      return "-";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }
    return parsed.toLocaleString("fa-IR");
  }, []);

  const fetchItems = useCallback(
    async (pageNumber: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiAdmin.get("/admin/catalog/items", {
          params: { page: pageNumber, limit: PAGE_SIZE },
        });
        const data: CatalogItem[] = response.data?.data ?? [];
        setItems(data);

        const meta = response.data?.meta ?? {};
        let nextPageAvailable = false;
        if (typeof meta.totalPages === "number") {
          nextPageAvailable = pageNumber < meta.totalPages;
        } else if (typeof meta.hasNextPage === "boolean") {
          nextPageAvailable = meta.hasNextPage;
        } else if (typeof meta.hasNext === "boolean") {
          nextPageAvailable = meta.hasNext;
        } else {
          nextPageAvailable = data.length === PAGE_SIZE;
        }
        setHasNextPage(Boolean(nextPageAvailable));
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : t("error");
        setError(message);
        setHasNextPage(false);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchItems(page);
  }, [fetchItems, page]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const response = await apiAdmin.get("/admin/catalog/categories");
      setCategories(response.data?.data ?? []);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : t("error");
      setCategoriesError(message);
    } finally {
      setCategoriesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchAddOns = useCallback(async () => {
    setAddOnsLoading(true);
    setAddOnsError(null);
    try {
      const response = await apiAdmin.get("/admin/catalog/addons");
      setAddOns(response.data?.data ?? []);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : t("error");
      setAddOnsError(message);
    } finally {
      setAddOnsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAddOns();
  }, [fetchAddOns]);

  const getCategoryIdsFromItem = (item: CatalogItem): string[] => {
    if (Array.isArray(item.categoryIds) && item.categoryIds.length > 0) {
      return item.categoryIds;
    }
    if (Array.isArray(item.categories)) {
      return item.categories
        .map((category) => {
          if (typeof category === "string") {
            return category;
          }
          if (category?._id) {
            return category._id;
          }
          if (category?.id) {
            return category.id;
          }
          return null;
        })
        .filter((value): value is string => Boolean(value));
    }
    return [];
  };

  const stringifyImages = (images?: unknown): string => {
    if (Array.isArray(images)) {
      return images
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
        .join(", ");
    }
    if (typeof images === "string") {
      return images;
    }
    return "";
  };

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setDialogTab("details");
  };

  const handleOpenEditDialog = (item: CatalogItem) => {
    setEditingId(item._id);
    setForm({
      name: item.name ?? "",
      price: typeof item.price === "number" ? item.price.toString() : "",
      categories: getCategoryIdsFromItem(item),
      images: stringifyImages(item.images),
      description: item.description ?? "",
      active: item.active ?? true,
      variants:
        item.variants?.map((variant) => ({
          name: variant?.name ?? "",
          priceDiff:
            typeof variant?.priceDiff === "number" ? variant.priceDiff.toString() : "",
        })) ?? [],
      addOnGroups:
        item.addOnGroups?.map((group) => ({
          group: group?.group ?? "",
          min: typeof group?.min === "number" ? group.min.toString() : "",
          max: typeof group?.max === "number" ? group.max.toString() : "",
          required: group?.required ?? false,
          addOnIds: group?.addOnIds ?? [],
        })) ?? [],
    });
    setDialogTab("details");
    setDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: CatalogItem) => {
    setDeleteTarget(item);
    setDeleteLoading(false);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const handleFormChange = (field: keyof ItemFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: "", priceDiff: "" }],
    }));
  };

  const handleVariantChange = (index: number, field: "name" | "priceDiff", value: string) => {
    setForm((prev) => {
      const nextVariants = [...prev.variants];
      nextVariants[index] = { ...nextVariants[index], [field]: value };
      return { ...prev, variants: nextVariants };
    });
  };

  const handleRemoveVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  };

  const handleAddAddOnGroup = () => {
    setForm((prev) => ({
      ...prev,
      addOnGroups: [
        ...prev.addOnGroups,
        { group: "", min: "", max: "", required: false, addOnIds: [] },
      ],
    }));
  };

  const handleAddOnGroupChange = (
    index: number,
    field: "group" | "min" | "max" | "required",
    value: string | boolean,
  ) => {
    setForm((prev) => {
      const nextGroups = [...prev.addOnGroups];
      nextGroups[index] = { ...nextGroups[index], [field]: value };
      return { ...prev, addOnGroups: nextGroups };
    });
  };

  const handleAddOnIdsChange = (index: number, event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const nextIds = typeof value === "string" ? value.split(",") : value;
    setForm((prev) => {
      const nextGroups = [...prev.addOnGroups];
      nextGroups[index] = { ...nextGroups[index], addOnIds: nextIds };
      return { ...prev, addOnGroups: nextGroups };
    });
  };

  const handleRemoveAddOnGroup = (index: number) => {
    setForm((prev) => ({
      ...prev,
      addOnGroups: prev.addOnGroups.filter((_, groupIndex) => groupIndex !== index),
    }));
  };

  const handleCategoriesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const nextValue = typeof value === "string" ? value.split(",") : value;
    setForm((prev) => ({
      ...prev,
      categories: nextValue,
    }));
  };

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setSnackbar({ open: true, severity: "error", message: validationToast });
      return;
    }
    const priceValue = Number(form.price);
    if (Number.isNaN(priceValue)) {
      setSnackbar({ open: true, severity: "error", message: validationToast });
      return;
    }
    const parsedVariants = [];
    for (const variant of form.variants) {
      const trimmedName = variant.name.trim();
      const priceDiffValue = variant.priceDiff ? Number(variant.priceDiff) : 0;
      if (variant.priceDiff && Number.isNaN(priceDiffValue)) {
        setSnackbar({ open: true, severity: "error", message: validationToast });
        return;
      }
      if (!trimmedName && !variant.priceDiff) {
        continue;
      }
      if (!trimmedName) {
        setSnackbar({ open: true, severity: "error", message: validationToast });
        return;
      }
      parsedVariants.push({ name: trimmedName, priceDiff: priceDiffValue });
    }

    const parsedAddOnGroups = [];
    for (const group of form.addOnGroups) {
      const trimmedGroup = group.group.trim();
      const minValue = group.min ? Number(group.min) : undefined;
      const maxValue = group.max ? Number(group.max) : undefined;
      if ((group.min && Number.isNaN(minValue)) || (group.max && Number.isNaN(maxValue))) {
        setSnackbar({ open: true, severity: "error", message: validationToast });
        return;
      }
      if (
        typeof minValue === "number" &&
        typeof maxValue === "number" &&
        minValue > maxValue
      ) {
        setSnackbar({ open: true, severity: "error", message: validationToast });
        return;
      }
      if (group.required && (minValue ?? 0) < 1) {
        setSnackbar({ open: true, severity: "error", message: validationToast });
        return;
      }
      if (
        !trimmedGroup &&
        !group.addOnIds.length &&
        minValue === undefined &&
        maxValue === undefined
      ) {
        continue;
      }
      parsedAddOnGroups.push({
        group: trimmedGroup,
        min: minValue,
        max: maxValue,
        required: group.required,
        addOnIds: group.addOnIds,
      });
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: priceValue,
      categoryIds: form.categories,
      images: form.images
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
      description: form.description.trim(),
      active: form.active,
      variants: parsedVariants,
      addOnGroups: parsedAddOnGroups,
    };
    try {
      if (editingId) {
        await apiAdmin.patch(`/admin/catalog/items/${editingId}`, payload);
      } else {
        await apiAdmin.post("/admin/catalog/items", payload);
      }
      await fetchItems(page);
      setSnackbar({ open: true, severity: "success", message: successToast });
      handleCloseDialog();
    } catch (submitError) {
      console.error(submitError);
      setSnackbar({ open: true, severity: "error", message: errorToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteLoading(true);
    try {
      await apiAdmin.delete(`/admin/catalog/items/${deleteTarget._id}`);
      await fetchItems(page);
      setSnackbar({ open: true, severity: "success", message: successToast });
      handleCloseDeleteDialog();
    } catch (deleteError) {
      console.error(deleteError);
      setSnackbar({ open: true, severity: "error", message: errorToast });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">{t("items.title")}</Typography>
        <Button variant="contained" onClick={handleOpenDialog}>
          {t("forms.newItem")}
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
          ) : items.length === 0 ? (
            <Typography align="center" color="text.secondary">
              Ù‡Ù†ÙˆØ² Ù‡ÛŒÚ† Ú©Ø§Ù„Ø§ÛŒÛŒ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.
            </Typography>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("forms.name")}</TableCell>
                      <TableCell>{t("forms.price")}</TableCell>
                      <TableCell>{t("forms.active")}</TableCell>
                      <TableCell>{t("forms.updatedAt")}</TableCell>
                      <TableCell align="right">{t("orders.column.actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          {typeof item.price === "number" ? formatPrice.format(item.price) : "-"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.active ? t("forms.active") : t("forms.inactive")}
                            color={item.active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(item.updatedAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title={t("forms.edit")}>
                              <IconButton size="small" onClick={() => handleOpenEditDialog(item)}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("forms.delete")}>
                              <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(item)}>
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

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  ØµÙØ­Ù‡ {page}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={handlePrevPage} disabled={page === 1 || loading}>
                    {t("orders.pagination.prev")}
                  </Button>
                  <Button variant="outlined" onClick={handleNextPage} disabled={!hasNextPage || loading}>
                    {t("orders.pagination.next")}
                  </Button>
                </Stack>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? t("forms.edit") : t("forms.newItem")}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Tabs
              value={dialogTab}
              onChange={(_, value) => setDialogTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{ mb: 2 }}
            >
              <Tab label={t("items.tabs.details")} value="details" />
              <Tab label={t("items.tabs.variants")} value="variants" />
              <Tab label={t("items.tabs.addOnGroups")} value="addons" />
            </Tabs>

            {dialogTab === "details" ? (
              <Stack spacing={2}>
                <TextField
                  label={t("forms.name")}
                  value={form.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label={t("forms.price")}
                  type="number"
                  value={form.price}
                  onChange={(event) => handleFormChange("price", event.target.value)}
                  required
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel id="item-categories-label">{t("forms.categories")}</InputLabel>
                  <Select
                    labelId="item-categories-label"
                    multiple
                    label={t("forms.categories")}
                    value={form.categories}
                    onChange={handleCategoriesChange}
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return "-";
                      }
                      return categories
                        .filter((category) => selected.includes(category._id))
                        .map((category) => category.name)
                        .join("، ");
                    }}
                    disabled={categoriesLoading}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {categoriesError ? <Alert severity="warning">{categoriesError}</Alert> : null}
                <TextField
                  label={t("forms.images")}
                  value={form.images}
                  onChange={(event) => handleFormChange("images", event.target.value)}
                  helperText={t("items.hints.images")}
                  fullWidth
                />
                <TextField
                  label={t("forms.description")}
                  value={form.description}
                  onChange={(event) => handleFormChange("description", event.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.active}
                      onChange={(event) => handleFormChange("active", event.target.checked)}
                    />
                  }
                  label={t("forms.active")}
                />
              </Stack>
            ) : null}

            {dialogTab === "variants" ? (
              <Stack spacing={2}>
                {form.variants.length === 0 ? (
                  <Alert severity="info">{t("items.messages.noVariants")}</Alert>
                ) : null}
                {form.variants.map((variant, index) => (
                  <Stack
                    key={`variant-${index}`}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="center"
                  >
                    <TextField
                      label={t("items.fields.variantName")}
                      value={variant.name}
                      onChange={(event) => handleVariantChange(index, "name", event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label={t("items.fields.variantPrice")}
                      type="number"
                      value={variant.priceDiff}
                      onChange={(event) => handleVariantChange(index, "priceDiff", event.target.value)}
                      fullWidth
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveVariant(index)}
                      aria-label={t("items.actions.deleteVariant")}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button variant="outlined" onClick={handleAddVariant}>
                  {t("items.actions.addVariant")}
                </Button>
              </Stack>
            ) : null}

            {dialogTab === "addons" ? (
              <Stack spacing={2}>
                {addOnsError ? <Alert severity="warning">{addOnsError}</Alert> : null}
                {form.addOnGroups.length === 0 ? (
                  <Alert severity="info">{t("items.messages.noAddOnGroups")}</Alert>
                ) : null}
                {form.addOnGroups.map((group, index) => (
                  <Stack
                    key={`addon-group-${index}`}
                    spacing={2}
                    sx={{ border: "1px solid", borderColor: "divider", p: 2, borderRadius: 2 }}
                  >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label={t("items.fields.addOnGroupName")}
                        value={group.group}
                        onChange={(event) => handleAddOnGroupChange(index, "group", event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label={t("items.fields.minSelection")}
                        type="number"
                        value={group.min}
                        onChange={(event) => handleAddOnGroupChange(index, "min", event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label={t("items.fields.maxSelection")}
                        type="number"
                        value={group.max}
                        onChange={(event) => handleAddOnGroupChange(index, "max", event.target.value)}
                        fullWidth
                      />
                    </Stack>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={group.required}
                          onChange={(event) => handleAddOnGroupChange(index, "required", event.target.checked)}
                        />
                      }
                      label={t("items.fields.required")}
                    />
                    <FormControl fullWidth>
                      <InputLabel id={`add-on-label-${index}`}>{t("items.fields.addOns")}</InputLabel>
                      <Select
                        labelId={`add-on-label-${index}`}
                        multiple
                        label={t("items.fields.addOns")}
                        value={group.addOnIds}
                        onChange={(event) => handleAddOnIdsChange(index, event)}
                        disabled={addOnsLoading}
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return "-";
                          }
                          return addOns
                            .filter((addOn) => selected.includes(addOn._id))
                            .map((addOn) => (addOn.group ? `${addOn.group} - ${addOn.name}` : addOn.name))
                            .join("، ");
                        }}
                      >
                        {addOns.map((addOn) => (
                          <MenuItem key={addOn._id} value={addOn._id}>
                            {addOn.group ? `${addOn.group} - ${addOn.name}` : addOn.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box display="flex" justifyContent="flex-end">
                      <Button color="error" onClick={() => handleRemoveAddOnGroup(index)}>
                        {t("items.actions.deleteGroup")}
                      </Button>
                    </Box>
                  </Stack>
                ))}
                <Button variant="outlined" onClick={handleAddAddOnGroup}>
                  {t("items.actions.addAddOnGroup")}
                </Button>
              </Stack>
            ) : null}
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
            {t("items.messages.deleteConfirm", { name: deleteTarget?.name ?? "" })}
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

export default AdminCatalogItemsPage;





