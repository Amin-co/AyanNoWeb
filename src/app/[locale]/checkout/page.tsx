"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Container from "@/components/ui/Container";
import { useCart } from "@/features/cart/store";
import api from "@/lib/api";

type Address = {
  id?: string;
  label: string;
  line1: string;
  city: string;
  lat?: number;
  lng?: number;
};

type AddressesResponse = { success: boolean; data?: Address[] };

type DeliverySlot = {
  window: string;
  capacity: number;
  reserved: number;
  available: number;
};

type SlotsResponse = {
  success: boolean;
  data?: {
    date: string;
    windows: DeliverySlot[];
  };
};

type CouponValidateResponse = {
  success: boolean;
  data?: {
    totalDiscount: number;
  };
};

type OrderCreateResponse = {
  success: boolean;
  data?: {
    orderId: string;
  };
};

const PAYMENT_OPTIONS = [
  { value: "online", labelKey: "online" },
  { value: "cod", labelKey: "cash" },
  { value: "pos", labelKey: "pos" },
  { value: "wallet", labelKey: "wallet" },
  { value: "mixed", labelKey: "mixed" },
] as const;

const formatCurrency = (locale: string, amount: number) =>
  new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const cartT = useTranslations("cart");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    state: { items, note, couponCode, discount },
    actions: { setOrderNote, applyCoupon, clearCart },
  } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [selectedSlotWindow, setSelectedSlotWindow] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] =
    useState<(typeof PAYMENT_OPTIONS)[number]["value"]>("online");
  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: "", line1: "", city: "" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotConflictWindow, setSlotConflictWindow] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<
    { message: string; severity: "success" | "error" } | null
  >(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth");
    } else {
      setHasToken(true);
    }
    setSessionReady(true);
  }, [router]);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.qty, 0),
    [items],
  );
  const baseShippingFee = 0;
  const shippingFee = deliveryMethod === "delivery" ? baseShippingFee : 0;
  const tax = 0;
  const total = subtotal - discount + shippingFee + tax;
  const currencyLabel = commonT("currency.toman");

  const addressesQuery = useQuery({
    queryKey: ["user-addresses"],
    enabled: hasToken,
    queryFn: async () => {
      const { data } = await api.get<AddressesResponse>("/users/me/addresses");
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  useEffect(() => {
    if (addressesQuery.data && addressesQuery.data.length > 0) {
      setSelectedAddressId((prev) => prev ?? addressesQuery.data?.[0]?.id);
    }
  }, [addressesQuery.data]);

  const slotsQuery = useQuery({
    queryKey: ["delivery-slots", deliveryMethod],
    enabled: hasToken && deliveryMethod === "delivery",
    queryFn: async () => {
      const { data } = await api.get<SlotsResponse>("/delivery/slots", {
        params: { date: todayIso() },
      });
      return data.data ?? { date: todayIso(), windows: [] };
    },
  });

  useEffect(() => {
    if (deliveryMethod === "pickup") {
      setSelectedAddressId(undefined);
      setSelectedSlotWindow(null);
      setSlotConflictWindow(null);
    }
  }, [deliveryMethod]);

  const couponMutation = useMutation({
    mutationFn: async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        throw new Error(t("couponRequired"));
      }
      if (items.length === 0) {
        throw new Error(cartT("emptyMessage"));
      }

      const cartPayload = {
        items: items.map((item) => ({
          itemId: item.id,
          categoryIds: item.categoryIds ?? [],
          qty: item.qty,
          price: item.price,
        })),
        subtotal,
        shippingFee,
      };

      const { data } = await api.post<CouponValidateResponse>("/coupons/validate", {
        code: trimmed,
        cart: cartPayload,
      });

      return {
        code: trimmed,
        discount: data.data?.totalDiscount ?? 0,
      };
    },
    onMutate: () => {
      setCouponError(null);
      setSubmitError(null);
    },
    onSuccess: ({ code, discount }) => {
      applyCoupon({ couponCode: code, discount });
      setCouponInput(code);
      setCouponError(null);
    },
    onError: (error) => {
      const message =
        typeof error === "string"
          ? error
          : (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            commonT("messages.loadFailed");
      setCouponError(message);
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (payload: { label: string; line1: string; city: string }) => {
      const { data } = await api.post<AddressesResponse>("/users/me/addresses", payload);
      return Array.isArray(data.data) ? data.data : [];
    },
    onMutate: () => {
      setSubmitError(null);
    },
    onSuccess: (addresses) => {
      queryClient.setQueryData(["user-addresses"], addresses);
      setAddressDialogOpen(false);
      setAddressForm({ label: "", line1: "", city: "" });
      const latest = addresses[addresses.length - 1];
      if (latest?.id) {
        setSelectedAddressId(latest.id);
      }
    },
    onError: (error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        commonT("messages.loadFailed");
      setSubmitError(message);
    },
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) {
        throw new Error(cartT("emptyMessage"));
      }
      if (deliveryMethod === "delivery") {
        if (!selectedAddressId) {
          throw new Error(t("addressRequired"));
        }
        if (!selectedSlotWindow) {
          throw new Error(t("slotRequired"));
        }
      }

      const slotPayload =
        deliveryMethod === "delivery" && selectedSlotWindow
          ? {
              date: slotsQuery.data?.date ?? todayIso(),
              window: selectedSlotWindow,
            }
          : undefined;

      const deliveryPayload: {
        method: "delivery" | "pickup";
        addressId?: string;
        slot?: { date: string; window: string };
      } =
        deliveryMethod === "delivery"
          ? {
              method: "delivery",
              addressId: selectedAddressId,
              ...(slotPayload ? { slot: slotPayload } : {}),
            }
          : { method: "pickup" };

      const { data } = await api.post<OrderCreateResponse>("/orders", {
        channel: "online",
        items: items.map((item) => ({
          itemId: item.id,
          qty: item.qty,
          variant: item.variant,
          addOns: (item.addOns ?? []).map((addon) => addon.id),
        })),
        delivery: deliveryPayload,
        couponCode: couponCode ?? undefined,
        payment: {
          method: selectedPayment,
        },
      });

      return data.data;
    },
    onMutate: () => {
      setSubmitError(null);
    },
    onSuccess: (data) => {
      clearCart();
      setSlotConflictWindow(null);
      setSnackbar({
        message: deliveryMethod === "pickup" ? t("successPickup") : t("success"),
        severity: "success",
      });
      if (data?.orderId) {
        router.push(`/account/orders/${data.orderId}`);
      } else {
        router.push("/account");
      }
    },
    onError: (error) => {
      const response = (error as {
        response?: { status?: number; data?: { message?: string } };
      })?.response;
      const message = response?.data?.message ?? commonT("messages.loadFailed");

      if (response?.status === 409) {
        const conflictMessage = response.data?.message ?? "ظرفیت این بازه تکمیل است";
        setSlotConflictWindow(selectedSlotWindow);
        setSubmitError(conflictMessage);
        setSnackbar({
          message: conflictMessage,
          severity: "error",
        });
        return;
      }

      setSubmitError(message);
      setSnackbar({
        message,
        severity: "error",
      });
    },
  });

  const addresses = addressesQuery.data ?? [];
  const slots = slotsQuery.data?.windows ?? [];
  const isAddressLimitReached = addresses.length >= 6;
  const isSubmitting = orderMutation.isPending;

  const handleApplyCoupon = () => {
    couponMutation.mutate(couponInput);
  };

  const handleAddAddress = () => {
    if (!addressForm.label.trim() || !addressForm.line1.trim() || !addressForm.city.trim()) {
      setSubmitError(t("addressFormIncomplete"));
      return;
    }
    addAddressMutation.mutate({
      label: addressForm.label.trim(),
      line1: addressForm.line1.trim(),
      city: addressForm.city.trim(),
    });
  };

  const summaryRows = [
    {
      label: cartT("subtotal"),
      value: `${formatCurrency(locale, subtotal)} ${currencyLabel}`,
    },
    {
      label: cartT("discount"),
      value:
        discount > 0
          ? `-${formatCurrency(locale, discount)} ${currencyLabel}`
          : `${formatCurrency(locale, discount)} ${currencyLabel}`,
    },
    ...(deliveryMethod === "delivery"
      ? [
          {
            label: cartT("shipping"),
            value: `${formatCurrency(locale, shippingFee)} ${currencyLabel}`,
          },
        ]
      : []),
    {
      label: cartT("tax"),
      value: `${formatCurrency(locale, tax)} ${currencyLabel}`,
    },
  ];

  const isSubmitDisabled =
    items.length === 0 ||
    (deliveryMethod === "delivery" && (!selectedAddressId || !selectedSlotWindow)) ||
    isSubmitting;

  if (!sessionReady) {
    return (
      <main style={{ padding: "2rem 0" }}>
        <Container>
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
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
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    {t("deliveryMethod")}
                  </Typography>
                  <RadioGroup
                    row
                    value={deliveryMethod}
                    onChange={(event) => setDeliveryMethod(event.target.value as "delivery" | "pickup")}
                  >
                    <FormControlLabel value="delivery" control={<Radio />} label={t("delivery")} />
                    <FormControlLabel value="pickup" control={<Radio />} label={t("pickup")} />
                  </RadioGroup>
                </CardContent>
              </Card>

              {deliveryMethod === "delivery" ? (
                <>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight={700}>
                          {t("addresses")}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setAddressDialogOpen(true)}
                          disabled={isAddressLimitReached}
                        >
                          {t("addAddress")}
                        </Button>
                      </Stack>
                      {addressesQuery.isLoading ? (
                        <Stack alignItems="center" py={3}>
                          <CircularProgress size={24} />
                        </Stack>
                      ) : addresses.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          {t("noAddresses")}
                        </Typography>
                      ) : (
                        <RadioGroup
                          value={selectedAddressId ?? ""}
                          onChange={(event) => setSelectedAddressId(event.target.value)}
                        >
                          {addresses.map((address) => (
                            <FormControlLabel
                              key={address.id}
                              value={address.id}
                              control={<Radio />}
                              label={
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {address.label}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {address.line1}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {address.city}
                                  </Typography>
                                </Box>
                              }
                            />
                          ))}
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        {t("deliveryWindow")}
                      </Typography>
                      {slotsQuery.isLoading ? (
                        <Stack alignItems="center" py={3}>
                          <CircularProgress size={24} />
                        </Stack>
                      ) : slots.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          {t("noSlots")}
                        </Typography>
                      ) : (
                        <>
                          <RadioGroup
                            value={selectedSlotWindow ?? ""}
                            onChange={(event) => {
                              setSelectedSlotWindow(event.target.value);
                              if (slotConflictWindow) {
                                setSlotConflictWindow(null);
                              }
                            }}
                          >
                            {slots.map((slot) => {
                              const isConflict = slotConflictWindow === slot.window;
                              return (
                                <FormControlLabel
                                  key={slot.window}
                                  value={slot.window}
                                  control={<Radio color={isConflict ? "error" : "primary"} />}
                                  sx={{
                                    alignItems: "flex-start",
                                    borderRadius: 1,
                                    border: isConflict ? "1px solid" : undefined,
                                    borderColor: isConflict ? "error.main" : undefined,
                                    mb: 1,
                                    py: 0.5,
                                    px: 1,
                                  }}
                                  label={
                                    <Box sx={{ color: isConflict ? "error.main" : "inherit" }}>
                                      <Typography variant="subtitle2" fontWeight={600}>
                                        {slot.window}
                                      </Typography>
                                      <Typography variant="caption" color={isConflict ? "error" : "text.secondary"}>
                                        {t("slotCapacity", {
                                          available: slot.available,
                                          capacity: slot.capacity,
                                        })}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              );
                            })}
                          </RadioGroup>
                          {slotConflictWindow && (
                            <Typography variant="caption" color="error" mt={1}>
                              {t("slotConflictPrompt")}
                            </Typography>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : null}

              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    {t("payment")}
                  </Typography>
                  <RadioGroup
                    value={selectedPayment}
                    onChange={(event) =>
                      setSelectedPayment(event.target.value as (typeof PAYMENT_OPTIONS)[number]["value"])
                    }
                  >
                    {PAYMENT_OPTIONS.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio />}
                        label={t(option.labelKey)}
                      />
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    {t("applyCoupon")}
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      value={couponInput}
                      onChange={(event) => setCouponInput(event.target.value)}
                      placeholder={t("couponPlaceholder")}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={handleApplyCoupon}
                      disabled={couponMutation.isPending || !couponInput.trim()}
                    >
                      {couponMutation.isPending ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        commonT("actions.apply")
                      )}
                    </Button>
                  </Stack>
                  {couponError ? (
                    <Typography variant="caption" color="error" mt={1}>
                      {couponError}
                    </Typography>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    {cartT("noteOrder")}
                  </Typography>
                  <TextField
                    value={note ?? ""}
                    onChange={(event) => setOrderNote(event.target.value || undefined)}
                    placeholder={t("notePlaceholder")}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </CardContent>
              </Card>

              {submitError ? (
                <Alert severity="error" onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              ) : null}

              <Button
                variant="contained"
                size="large"
                onClick={() => orderMutation.mutate()}
                disabled={isSubmitDisabled}
              >
                {isSubmitting ? <CircularProgress size={20} color="inherit" /> : t("completePayment")}
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box position="sticky" top={96}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    {cartT("title")}
                  </Typography>
                  <Stack spacing={1.5}>
                    {summaryRows.map((row) => (
                      <SummaryRow key={row.label} label={row.label} value={row.value} />
                    ))}
                    <Divider />
                    <SummaryRow
                      label={cartT("total")}
                      value={`${formatCurrency(locale, total)} ${currencyLabel}`}
                      bold
                    />
                    {couponCode ? (
                      <Typography variant="caption" color="text.secondary">
                        {cartT("couponApplied", { code: couponCode })}
                      </Typography>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("addAddress")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("addressLabel")}
              value={addressForm.label}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, label: event.target.value }))}
              fullWidth
            />
            <TextField
              label={t("addressLine1")}
              value={addressForm.line1}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, line1: event.target.value }))}
              fullWidth
            />
            <TextField
              label={t("city")}
              value={addressForm.city}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddressDialogOpen(false)}>{commonT("actions.cancel")}</Button>
          <Button onClick={handleAddAddress} variant="contained" disabled={addAddressMutation.isPending}>
            {addAddressMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("saveAddress")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar ? (
        <Snackbar
          open
          autoHideDuration={6000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: locale === "fa" ? "left" : "right" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      ) : null}
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
