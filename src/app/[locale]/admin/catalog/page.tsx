import { redirect } from "next/navigation";

type AdminCatalogIndexProps = {
  params: {
    locale: string;
  };
};

export default function AdminCatalogIndex({ params }: AdminCatalogIndexProps) {
  redirect(`/${params.locale}/admin/catalog/items`);
}
