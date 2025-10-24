"use client";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useCart } from "@/features/cart/store";
import type { CartItem } from "@/features/cart/types";
import Container from "@/components/ui/Container";
import { useMemo } from "react";

const formatCurrency = (locale: string, amount: number) =>
  new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

const computeItemTotal = (item: CartItem) => item.price * item.qty;

export default function CartPage() {
  const t = useTranslations("cart");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const {
    state: { items, note, couponCode, discount },
    actions: { updateQty, setItemNote, removeItem, clearCart, setOrderNote },
  } = useCart();

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + computeItemTotal(item), 0),
    [items],
  );
  const shipping = 0;
  const tax = 0;
  const total = subtotal - discount + shipping + tax;
  const currencyLabel = commonT("currency.toman");

  const handleQtyChange = (item: CartItem, delta: number) => {
    const nextQty = item.qty + delta;
    if (nextQty < 1) {
      removeItem(item.id);
      return;
    }
    updateQty(item.id, nextQty);
  };

  if (items.length === 0) {
    return (
      <main style={{ padding: "2rem 0" }}>
        <Container>
          <Card>
            <CardContent>
              <Stack spacing={3} alignItems="center" textAlign="center" py={6}>
                <Typography component="h1" variant="h5" fontWeight={700}>
                  {t("title")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("emptyMessage")}
                </Typography>
                <Button variant="contained" onClick={() => router.push("/menu")}>
                  {t("continueShopping")}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {items.map((item) => {
                const itemTotal = computeItemTotal(item);
                const formattedTotal = formatCurrency(locale, itemTotal);
                const unitPriceLabel = formatCurrency(locale, item.price);
                const image = item.image;
                const addOns = Array.isArray(item.addOns) ? item.addOns : [];

                return (
                  <Card key={`${item.id}-${item.variant ?? "default"}`}>
                    <CardContent>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={3}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                      >
                        <Avatar
                          variant="rounded"
                          src={image}
                          alt={item.name}
                          sx={{ width: 96, height: 96, bgcolor: "rgba(255,255,255,0.08)" }}
                        >
                          {item.name.slice(0, 1)}
                        </Avatar>

                        <Box flex={1} width="100%">
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box>
                              <Typography variant="h6" fontWeight={700}>
                                {item.name}
                              </Typography>
                              {item.variant ? (
                                <Typography variant="body2" color="text.secondary">
                                  {item.variant}
                                </Typography>
                              ) : null}
                              {addOns.length > 0 ? (
                                <Typography variant="body2" color="text.secondary" mt={0.5}>
                                  {t("addOns")}:{" "}
                                  {addOns
                                    .map((addOn) =>
                                      addOn.price
                                        ? `${addOn.name} (+${formatCurrency(locale, addOn.price)} ${currencyLabel})`
                                        : addOn.name,
                                    )
                                    .join(locale === "fa" ? "، " : ", ")}
                                </Typography>
                              ) : null}
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <IconButton onClick={() => handleQtyChange(item, -1)} aria-label="decrease">
                                <RemoveCircleOutlineIcon />
                              </IconButton>
                              <Typography variant="body1" minWidth={24} textAlign="center">
                                {item.qty}
                              </Typography>
                              <IconButton onClick={() => handleQtyChange(item, 1)} aria-label="increase">
                                <AddCircleOutlineIcon />
                              </IconButton>
                              <IconButton onClick={() => removeItem(item.id)} aria-label="remove">
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Stack>
                          </Stack>

                          <Box mt={2}>
                            <TextField
                              label={t("noteItem")}
                              value={item.note ?? ""}
                              onChange={(event) =>
                                setItemNote(item.id, event.target.value || undefined)
                              }
                              fullWidth
                              multiline
                              minRows={2}
                            />
                          </Box>

                          <Typography variant="subtitle1" fontWeight={700} mt={2}>
                            {unitPriceLabel} × {item.qty} = {formattedTotal} {currencyLabel}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box position="sticky" top={96}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    {t("title")}
                  </Typography>
                  <Stack spacing={1.5}>
                    <SummaryRow
                      label={t("subtotal")}
                      value={`${formatCurrency(locale, subtotal)} ${currencyLabel}`}
                    />
                    <SummaryRow
                      label={t("discount")}
                      value={
                        discount > 0
                          ? `-${formatCurrency(locale, discount)} ${currencyLabel}`
                          : `${formatCurrency(locale, discount)} ${currencyLabel}`
                      }
                    />
                    <SummaryRow
                      label={t("shipping")}
                      value={`${formatCurrency(locale, shipping)} ${currencyLabel}`}
                    />
                    <SummaryRow
                      label={t("tax")}
                      value={`${formatCurrency(locale, tax)} ${currencyLabel}`}
                    />
                    <Divider />
                    <SummaryRow
                      label={t("total")}
                      value={`${formatCurrency(locale, total)} ${currencyLabel}`}
                      bold
                    />
                    {couponCode ? (
                      <Typography variant="caption" color="text.secondary">
                        {t("couponApplied", { code: couponCode })}
                      </Typography>
                    ) : null}
                    <TextField
                      label={t("noteOrder")}
                      value={note ?? ""}
                      onChange={(event) => setOrderNote(event.target.value || undefined)}
                      fullWidth
                      multiline
                      minRows={2}
                    />
                    <Stack direction="row" spacing={1} mt={1}>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={() => router.push("/checkout")}
                      >
                        {t("checkout")}
                      </Button>
                    </Stack>
                    <Button
                      variant="text"
                      color="inherit"
                      onClick={() => router.push("/menu")}
                    >
                      {t("continueShopping")}
                    </Button>
                    <Button variant="text" color="error" onClick={clearCart}>
                      {t("clearCart")}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant={bold ? "subtitle1" : "body2"} fontWeight={bold ? 700 : 400}>
        {value}
      </Typography>
    </Stack>
  );
}
