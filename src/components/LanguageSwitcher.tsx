"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { FormControl, MenuItem, Select, type SelectChangeEvent } from "@mui/material";

const languageOptions = [
  { value: "fa", label: "Farsi" },
  { value: "en", label: "English" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const nextLocale = event.target.value;
    if (!nextLocale || nextLocale === locale) {
      return;
    }

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: 120,
        display: { xs: "none", md: "inline-flex" },
      }}
    >
      <Select
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        variant="outlined"
        inputProps={{ "aria-label": "Select language" }}
      >
        {languageOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
