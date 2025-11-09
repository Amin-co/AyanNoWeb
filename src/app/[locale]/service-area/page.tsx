"use client";

import { useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import Container from "@/components/ui/Container";
import api from "@/lib/api";
import { useRouter } from "@/navigation";

type DeliveryZone = {
  _id: string;
  name: string;
  description?: string;
  minOrder?: number;
  shippingFee?: number;
};

type DeliveryZonesResponse = {
  success: boolean;
  data?: DeliveryZone[];
};

const MAP_PLACEHOLDER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

const fetchZones = async (): Promise<DeliveryZone[]> => {
  const { data } = await api.get<DeliveryZonesResponse>("/delivery/zones");
  return Array.isArray(data?.data) ? data.data : [];
};

export default function ServiceAreaPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("serviceArea");
  const zonesT = useTranslations("serviceArea.zones");
  const commonT = useTranslations("common");

  const currencyLabel = commonT("currency.toman");
  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const zonesQuery = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: fetchZones,
  });

  const zones = zonesQuery.data ?? [];

  const formatAmount = (value?: number) => {
    if (typeof value !== "number") {
      return "-";
    }
    return `${priceFormatter.format(value)} ${currencyLabel}`;
  };

  const renderZones = () => {
    if (zonesQuery.isLoading) {
      return (
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      );
    }

    if (zonesQuery.isError) {
      return (
        <Card>
          <CardContent>
            <Typography variant="body2" color="error">
              {commonT("messages.loadFailed")}
            </Typography>
          </CardContent>
        </Card>
      );
    }

    if (zones.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          {zonesT("empty")}
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        {zones.map((zone) => (
          <Card key={zone._id}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                {zone.name}
              </Typography>
              {zone.description ? (
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {zone.description}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={3} mt={2}>
                <Typography variant="body2" color="text.secondary">
                  {zonesT("minOrder", { value: formatAmount(zone.minOrder) })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {zonesT("shippingFee", { value: formatAmount(zone.shippingFee) })}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  return (
    <main style={{ padding: "2rem 0" }}>
      <Container>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography component="h1" variant="h4" fontWeight={700}>
              {t("title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("description")}
            </Typography>
          </Stack>

          <Card>
            <CardContent>
              <Box
                component="img"
                src={MAP_PLACEHOLDER}
                alt={t("mapAlt")}
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  objectFit: "cover",
                  maxHeight: 360,
                }}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                mt={3}
              >
                <Typography variant="body1" color="text.secondary">
                  {t("mapCaption")}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push("/checkout")}
                  sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
                >
                  {t("cta")}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              {zonesT("title")}
            </Typography>
            {renderZones()}
          </Stack>
        </Stack>
      </Container>
    </main>
  );
}
