"use client";

import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Drawer,
  FormControlLabel,
  FormGroup,
  IconButton,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Checkbox,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Container from "@/components/ui/Container";
import api from "@/lib/api";
import { usePathname, useRouter } from "@/navigation";
import { useCart } from "@/features/cart/store";
import type { CartItem } from "@/features/cart/types";

type Category = {
  id?: string;
  name: string;
  slug: string;
};

type CategoriesResponse = {
  success: boolean;
  data: Category[];
};

type MenuItem = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  images?: string[];
  marketingTags?: string[];
  spicyLevel?: number;
  categories?: string[];
  variants?: { name: string; priceDiff?: number }[];
  addOns?: { id: string; name: string; price?: number }[];
};

type ItemsResponse = {
  success: boolean;
  data: MenuItem[];
};

const PAGE_LIMIT = 60;

const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<CategoriesResponse>("/catalog/categories", {
    params: { limit: 100 },
  });
  return Array.isArray(data?.data) ? data.data : [];
};

const fetchItems = async (params: {
  q?: string;
  category?: string;
  priceMin?: string;
  priceMax?: string;
}): Promise<MenuItem[]> => {
  const { data } = await api.get<ItemsResponse>("/catalog/items", {
    params: {
      limit: PAGE_LIMIT,
      ...(params.q ? { q: params.q } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.priceMin ? { priceMin: params.priceMin } : {}),
      ...(params.priceMax ? { priceMax: params.priceMax } : {}),
    },
  });

  return Array.isArray(data?.data) ? data.data : [];
};

const formatPrice = (locale: string, price?: number) => {
  if (typeof price !== "number") return null;
  const formatter = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 0,
  });
  return formatter.format(price);
};

const itemHasOptions = (item: MenuItem | null): boolean => {
  if (!item) return false;
  return (
    (Array.isArray(item.variants) && item.variants.length > 0) ||
    (Array.isArray(item.addOns) && item.addOns.length > 0)
  );
};

const getPrimaryImage = (item: MenuItem): string =>
  item.images?.[0] ??
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80";

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuPageFallback />}>
      <MenuPageContent />
    </Suspense>
  );
}

function MenuPageFallback() {
  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={48} />
          <Skeleton variant="rectangular" height={240} />
        </Stack>
      </Container>
    </main>
  );
}

function MenuPageContent() {
  const t = useTranslations("menu");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const {
    actions: { addItem },
  } = useCart();

  const searchParam = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const priceMinParam = searchParams.get("priceMin") ?? "";
  const priceMaxParam = searchParams.get("priceMax") ?? "";

  const [searchValue, setSearchValue] = useState(searchParam);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSearchValue(searchParam);
  }, [searchParam]);

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: items = [],
    isLoading: loadingItems,
    isFetching: fetchingItems,
  } = useQuery({
    queryKey: [
      "menu-items",
      {
        q: searchParam,
        category: categoryParam,
        priceMin: priceMinParam,
        priceMax: priceMaxParam,
        locale,
      },
    ],
    queryFn: () =>
      fetchItems({
        q: searchParam || undefined,
        category: categoryParam || undefined,
        priceMin: priceMinParam || undefined,
        priceMax: priceMaxParam || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const isInitialLoading = loadingCategories || (loadingItems && items.length === 0);
  const showSkeletons = isInitialLoading;
  const isEmpty = !isInitialLoading && items.length === 0 && !fetchingItems;

  const filtersActive =
    Boolean(searchParam || categoryParam || priceMinParam || priceMaxParam) || isPending;

  const updateQuery = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    startTransition(() => {
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, {
        scroll: false,
      });
    });
  };

  const handleCategoryToggle = (slug: string) => {
    updateQuery({
      category: slug === categoryParam ? undefined : slug,
    });
  };

  const handleSearch = () => {
    updateQuery({
      q: searchValue.trim() || undefined,
    });
  };

  const handleClearFilters = () => {
    updateQuery({
      q: undefined,
      category: undefined,
      priceMin: undefined,
      priceMax: undefined,
    });
  };

  const priceFormatter = useMemo(
    () => (value?: number) => {
      const formatted = formatPrice(locale, value);
      if (!formatted) return null;
      return t("price", { value: formatted });
    },
    [locale, t],
  );

  const buildCartAddOns = (item: MenuItem, addOnIds: string[]) =>
    (item.addOns ?? [])
      .filter((addOn) => addOnIds.includes(addOn.id))
      .map((addOn) => ({
        id: addOn.id,
        name: addOn.name,
        price: addOn.price ?? 0,
      }));

  const resolveVariantPriceDiff = (item: MenuItem, variantName?: string) => {
    if (!variantName) return 0;
    const variant = item.variants?.find((entry) => entry.name === variantName);
    return variant?.priceDiff ?? 0;
  };

  const calculateUnitPrice = (item: MenuItem, variantName?: string, addOnIds: string[] = []) => {
    const base = item.price ?? 0;
    const variantDiff = resolveVariantPriceDiff(item, variantName);
    const addOnsTotal = (item.addOns ?? [])
      .filter((addOn) => addOnIds.includes(addOn.id))
      .reduce((total, addOn) => total + (addOn.price ?? 0), 0);
    return base + variantDiff + addOnsTotal;
  };

  const addItemToCart = (item: MenuItem, variantName?: string, addOnIds: string[] = []) => {
    const unitPrice = calculateUnitPrice(item, variantName, addOnIds);
    const payload: CartItem = {
      id: item.id,
      slug: item.slug,
      name: item.name,
      image: item.images?.[0],
      price: unitPrice,
      qty: 1,
      variant: variantName,
      addOns: buildCartAddOns(item, addOnIds),
      categoryIds: item.categories ?? [],
    };
    addItem(payload);
  };

  const handleAddClick = (item: MenuItem) => {
    if (itemHasOptions(item)) {
      setSelectedItem(item);
      setSelectedVariant(item.variants?.[0]?.name);
      setSelectedAddOns(new Set());
      setDrawerOpen(true);
      return;
    }
    addItemToCart(item);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedItem(null);
    setSelectedVariant(undefined);
    setSelectedAddOns(new Set());
  };

  const handleDrawerConfirm = () => {
    if (!selectedItem) return;
    const addOnIds = Array.from(selectedAddOns);
    addItemToCart(selectedItem, selectedVariant, addOnIds);
    handleDrawerClose();
  };

  const drawerUnitPrice = selectedItem
    ? calculateUnitPrice(selectedItem, selectedVariant, Array.from(selectedAddOns))
    : 0;

  const drawerPriceLabel = priceFormatter(drawerUnitPrice);
  const currencyLabel = commonT("currency.toman");

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
          <Typography component="h1" variant="h4" fontWeight={700}>
            {t("title")}
          </Typography>
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            disabled={!filtersActive || loadingItems}
          >
            {t("clearFilters")}
          </Button>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          gap={2}
          mb={3}
        >
          <TextField
            fullWidth
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder={t("search.placeholder")}
            InputProps={{
              endAdornment: (
                <IconButton edge="end" onClick={handleSearch} aria-label={t("search.placeholder")}>
                  <SearchIcon />
                </IconButton>
              ),
            }}
          />
        </Stack>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            pb: 2,
            mb: 3,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Chip
            label={t("filters.category")}
            color={categoryParam ? "default" : "primary"}
            variant={categoryParam ? "outlined" : "filled"}
            onClick={() => handleCategoryToggle("")}
          />
          {(categories ?? []).map((category) => (
            <Chip
              key={category.slug}
              label={category.name}
              clickable
              color={category.slug === categoryParam ? "primary" : "default"}
              variant={category.slug === categoryParam ? "filled" : "outlined"}
              onClick={() => handleCategoryToggle(category.slug)}
            />
          ))}
          {loadingCategories &&
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                width={80}
                height={32}
                sx={{ flexShrink: 0, borderRadius: 999 }}
              />
            ))}
        </Box>

        {showSkeletons ? (
          <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: "100%" }}>
                  <Skeleton variant="rectangular" height={180} />
                  <CardContent>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="40%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : null}

        {isEmpty ? (
          <Box
            sx={{
              border: "1px dashed rgba(255,255,255,0.2)",
              borderRadius: 3,
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <Typography variant="h6" mb={1}>
              {t("empty")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("clearFilters")}
            </Typography>
          </Box>
        ) : null}

        {!showSkeletons && !isEmpty ? (
          <Grid container spacing={3}>
            {items.map((item) => {
              const priceLabel = priceFormatter(item.price);
              const imageSrc = getPrimaryImage(item);

              return (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardActionArea onClick={() => handleAddClick(item)}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={imageSrc}
                        alt={item.name}
                        sx={{ objectFit: "cover" }}
                      />
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Typography variant="h6" fontWeight={700}>
                            {item.name}
                          </Typography>
                          {item.description ? (
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          ) : null}
                          <Stack direction="row" gap={1} flexWrap="wrap">
                            {item.marketingTags?.map((tag) => (
                              <Chip key={tag} label={tag} size="small" color="primary" />
                            ))}
                            {typeof item.spicyLevel === "number" && item.spicyLevel > 0 ? (
                              <Chip
                                size="small"
                                label={`${t("filters.spicy")}: ${item.spicyLevel}`}
                                variant="outlined"
                              />
                            ) : null}
                          </Stack>
                          {priceLabel ? (
                            <Typography variant="subtitle1" fontWeight={700}>
                              {priceLabel}
                            </Typography>
                          ) : null}
                          <Typography variant="caption" color="text.secondary">
                            {t("rating", { value: "4.7" })}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                    <Box px={2} pb={2}>
                      <Button fullWidth variant="contained" onClick={() => handleAddClick(item)}>
                        {t("addToCart")}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : null}

        <Drawer anchor="bottom" open={drawerOpen} onClose={handleDrawerClose}>
          <Box
            sx={{
              p: 3,
              maxWidth: 480,
              mx: "auto",
              width: "100%",
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                {t("drawer.title")} – {selectedItem?.name ?? ""}
              </Typography>
              <IconButton onClick={handleDrawerClose} aria-label={commonT("actions.close")}>
                <CloseIcon />
              </IconButton>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {t("drawer.description")}
            </Typography>
            <Stack spacing={3}>
              {selectedItem?.variants && selectedItem.variants.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    {t("drawer.variant")}
                  </Typography>
                  <RadioGroup
                    value={selectedVariant ?? ""}
                    onChange={(event) => setSelectedVariant(event.target.value || undefined)}
                  >
                    {selectedItem.variants.map((variant) => {
                      const diff = variant.priceDiff ?? 0;
                      const diffLabel =
                        diff === 0
                          ? ""
                          : diff > 0
                            ? `+${priceFormatter(diff)}`
                            : `-${priceFormatter(Math.abs(diff))}`;
                      return (
                        <FormControlLabel
                          key={variant.name}
                          value={variant.name}
                          control={<Radio />}
                          label={
                            diffLabel ? `${variant.name} (${diffLabel} ${currencyLabel})` : variant.name
                          }
                        />
                      );
                    })}
                  </RadioGroup>
                </Box>
              ) : null}

              {selectedItem?.addOns && selectedItem.addOns.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    {t("drawer.addOns")}
                  </Typography>
                  <FormGroup>
                    {selectedItem.addOns.map((addOn) => {
                      const checked = selectedAddOns.has(addOn.id);
                      const priceLabel = priceFormatter(addOn.price);
                      return (
                        <FormControlLabel
                          key={addOn.id}
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={(event) => {
                                setSelectedAddOns((prev) => {
                                  const next = new Set(prev);
                                  if (event.target.checked) {
                                    next.add(addOn.id);
                                  } else {
                                    next.delete(addOn.id);
                                  }
                                  return next;
                                });
                              }}
                            />
                          }
                          label={
                            priceLabel
                              ? `${addOn.name} (+${priceLabel} ${currencyLabel})`
                              : addOn.name
                          }
                        />
                      );
                    })}
                  </FormGroup>
                </Box>
              ) : null}

              <Divider />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  {drawerPriceLabel ? `${drawerPriceLabel} ${currencyLabel}` : ""}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button onClick={handleDrawerClose}>{commonT("actions.cancel")}</Button>
                  <Button variant="contained" onClick={handleDrawerConfirm}>
                    {t("drawer.confirm")}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Drawer>
      </Container>
    </main>
  );
}
