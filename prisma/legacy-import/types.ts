export interface LegacyCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  image_url: string | null;
  icon_url: string | null;
  image_alt: string | null;
  available: boolean;
  categories_menu_show: boolean;
  top_menu_separate_show: boolean;
  order: number;
  level: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface LegacyBrand {
  id: number;
  name: string;
  image_url: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface LegacyProductListItem {
  id: number;
}

export interface LegacyProductImage {
  id: number;
  image: string;
  image_alt: string;
  default: boolean;
  order: number;
}

export interface LegacyVariantAttribute {
  id: number;
  name: string;
  value: string;
  order: number;
}

export interface LegacyProductVariant {
  id: number;
  product_id: number;
  price: number | null;
  compare_at_price: number | null;
  stock: number;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  barcode: string;
  product_identifier: string;
  processing_time: number;
  is_default: boolean;
  image: { id: number; image: string; image_alt: string } | null;
  attributes: LegacyVariantAttribute[];
}

export interface LegacyProductDetail {
  id: number;
  name: string;
  english_name: string | null;
  slug: string;
  description: string | null;
  analysis: string | null;
  main_category: { id: number; name: string };
  other_categories: { id: number; name: string }[];
  brand: { id: number; name: string } | null;
  is_digital: boolean;
  price: number | null;
  compare_at_price: number | null;
  special_offer: boolean;
  special_offer_end: string | null;
  cost_per_item: number | null;
  batch_size: number;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  barcode: string;
  available: boolean;
  show_price: boolean;
  has_variants: boolean;
  stock: number;
  stock_type: { value: "unlimited" | "limited" | "out_of_stock" | "call"; label: string };
  min_order_quantity: number | null;
  max_order_quantity: number | null;
  guarantee: string | null;
  product_identifier: string;
  processing_time: number;
  seo_title: string | null;
  seo_description: string | null;
  views: number;
  tags: string[];
  images: LegacyProductImage[];
  variants: LegacyProductVariant[];
}

export interface LegacyCustomer {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  national_number: string | null;
  card_number: string | null;
  is_active: boolean;
  verified: boolean;
  receive_newsletters: boolean;
  management_sms_notifications: boolean;
  management_email_notifications: boolean;
  referer: string | null;
  creation_method: string | null;
  date_joined: string;
}

export interface LegacyOrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  variant_id: number | null;
  variant_name: string | null;
  quantity: number;
  price: number;
  compare_at_price: number | null;
  total_price: number;
  weight: number | null;
}

export interface LegacyOrder {
  id: number;
  customer_name: string;
  // Observed nullable at runtime for some legacy records (same class of gap
  // as LegacyCustomer.phone_number) despite the legacy API's own OpenAPI doc
  // implying it's required — see hasCustomerPhone in orders.ts.
  customer_phone: string | null;
  status: "processing" | "finished" | "canceled" | string;
  payment_method: string | null;
  payment_status: "pending" | "paid" | string;
  psp: string | null;
  creation_date: string;
  shipping_method_name: string | null;
  final_price: number;
  referer: string | null;
  shipping_tracking_code: string | null;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_phone_number: string | null;
  shipping_address: string | null;
  shipping_province: string | null;
  shipping_city: string | null;
  shipping_zip_code: string | null;
  items: LegacyOrderItem[];
}

export interface LegacyOrderPayment {
  id: number;
  mixin_transaction_number: string;
  order_id: number;
  creation_date: string;
  price: number;
  method: string | null;
  method_display: string | null;
  status: "initiated" | "sent" | "completed" | "failed" | string;
  psp: string | null;
  psp_display: string | null;
  transaction_number: string | null;
  card_number: string | null;
}
