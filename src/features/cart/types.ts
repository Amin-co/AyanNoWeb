export type CartAddOn = {
  id: string;
  name: string;
  price: number;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  price: number;
  qty: number;
  variant?: string;
  addOns?: CartAddOn[];
  note?: string;
  categoryIds?: string[];
};
