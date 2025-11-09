import { redirect } from "next/navigation";

type AdminCatalogIndexParams = {
  locale: string;
};

export default async function AdminCatalogIndex({
  params,
}: {
  params: Promise<AdminCatalogIndexParams>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/catalog/items`);
}
