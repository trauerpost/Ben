export interface Database {
  public: {
    Tables: {
      assets: {
        Row: Asset;
        Insert: AssetInsert;
        Update: AssetUpdate;
      };
      card_templates: {
        Row: CardTemplate;
        Insert: CardTemplateInsert;
        Update: CardTemplateUpdate;
      };
      credit_packages: {
        Row: CreditPackage;
        Insert: CreditPackageInsert;
        Update: CreditPackageUpdate;
      };
      credit_transactions: {
        Row: CreditTransaction;
        Insert: CreditTransactionInsert;
        Update: CreditTransactionUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      promo_codes: {
        Row: PromoCode;
        Insert: PromoCodeInsert;
        Update: PromoCodeUpdate;
      };
      invoices: {
        Row: Invoice;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      pricing: {
        Row: Pricing;
        Insert: PricingInsert;
        Update: PricingUpdate;
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      deduct_credit: {
        Args: {
          p_customer_id: string;
          p_order_id: string;
          p_description?: string;
        };
        Returns: number;
      };
    };
  };
}

// ── Assets ──

export interface Asset {
  id: string;
  name: string;
  category: "background" | "border" | "symbol" | "icon" | "ornament" | "photo_frame";
  file_url: string;
  thumbnail_url: string | null;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface AssetInsert {
  id?: string;
  name: string;
  category: "background" | "border" | "symbol" | "icon" | "ornament" | "photo_frame";
  file_url: string;
  thumbnail_url?: string | null;
  tags?: string[];
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface AssetUpdate {
  id?: string;
  name?: string;
  category?: "background" | "border" | "symbol" | "icon" | "ornament" | "photo_frame";
  file_url?: string;
  thumbnail_url?: string | null;
  tags?: string[];
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
}

// ── Card Templates ──

export interface CardTemplate {
  id: string;
  name: string;
  category: "sterbebild" | "trauerkarte" | "dankkarte";
  preview_url: string | null;
  template_data: Record<string, unknown>;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CardTemplateInsert {
  id?: string;
  name: string;
  category: "sterbebild" | "trauerkarte" | "dankkarte";
  preview_url?: string | null;
  template_data: Record<string, unknown>;
  tags?: string[];
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CardTemplateUpdate {
  id?: string;
  name?: string;
  category?: "sterbebild" | "trauerkarte" | "dankkarte";
  preview_url?: string | null;
  template_data?: Record<string, unknown>;
  tags?: string[];
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// ── Credit Packages ──

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface CreditPackageInsert {
  id?: string;
  name: string;
  credits: number;
  price_cents: number;
  currency?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface CreditPackageUpdate {
  id?: string;
  name?: string;
  credits?: number;
  price_cents?: number;
  currency?: string;
  is_active?: boolean;
  created_at?: string;
}

// ── Credit Transactions ──

export interface CreditTransaction {
  id: string;
  customer_id: string;
  amount: number;
  balance_after: number;
  description: string | null;
  order_id: string | null;
  created_at: string;
}

export interface CreditTransactionInsert {
  id?: string;
  customer_id: string;
  amount: number;
  balance_after: number;
  description?: string | null;
  order_id?: string | null;
  created_at?: string;
}

export interface CreditTransactionUpdate {
  id?: string;
  customer_id?: string;
  amount?: number;
  balance_after?: number;
  description?: string | null;
  order_id?: string | null;
  created_at?: string;
}

// ── Customers ──

export type CustomerType = "regular" | "one_time";
export type CustomerRole = "customer" | "admin";

export interface Customer {
  id: string;
  email: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  customer_type: CustomerType;
  role: CustomerRole;
  credits_remaining: number;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInsert {
  id?: string;
  email: string;
  name: string;
  company_name?: string | null;
  phone?: string | null;
  customer_type?: CustomerType;
  role?: CustomerRole;
  credits_remaining?: number;
  auth_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerUpdate {
  id?: string;
  email?: string;
  name?: string;
  company_name?: string | null;
  phone?: string | null;
  customer_type?: CustomerType;
  role?: CustomerRole;
  credits_remaining?: number;
  auth_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ── Orders ──

export type OrderStatus = "draft" | "pending_payment" | "paid" | "in_production" | "ready_for_pickup" | "shipped" | "completed" | "cancelled";
export type CardType = "sterbebild" | "trauerkarte" | "dankkarte";
export type PaymentMethod = "stripe" | "credit" | "invoice";

export interface Order {
  id: string;
  customer_id: string | null;
  guest_email: string | null;
  guest_name: string | null;
  status: OrderStatus;
  card_type: CardType | null;
  product_id: string | null;
  card_data: Record<string, unknown>;
  pdf_url: string | null;
  quantity: number;
  price_cents: number | null;
  currency: string;
  payment_method: PaymentMethod | null;
  payment_id: string | null;
  invoice_url: string | null;
  notes: string | null;
  promo_code_id: string | null;
  invoice_id: string | null;
  shipment_notes: string | null;
  shipped_at: string | null;
  pickup_ready_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderInsert {
  id?: string;
  customer_id?: string | null;
  guest_email?: string | null;
  guest_name?: string | null;
  status?: OrderStatus;
  card_type?: CardType | null;
  product_id?: string | null;
  card_data?: Record<string, unknown>;
  pdf_url?: string | null;
  quantity?: number;
  price_cents?: number | null;
  currency?: string;
  payment_method?: PaymentMethod | null;
  payment_id?: string | null;
  invoice_url?: string | null;
  notes?: string | null;
  promo_code_id?: string | null;
  invoice_id?: string | null;
  shipment_notes?: string | null;
  shipped_at?: string | null;
  pickup_ready_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderUpdate {
  id?: string;
  customer_id?: string | null;
  guest_email?: string | null;
  guest_name?: string | null;
  status?: OrderStatus;
  card_type?: CardType | null;
  product_id?: string | null;
  card_data?: Record<string, unknown>;
  pdf_url?: string | null;
  quantity?: number;
  price_cents?: number | null;
  currency?: string;
  payment_method?: PaymentMethod | null;
  payment_id?: string | null;
  invoice_url?: string | null;
  notes?: string | null;
  promo_code_id?: string | null;
  invoice_id?: string | null;
  shipment_notes?: string | null;
  shipped_at?: string | null;
  pickup_ready_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ── Promo Codes ──

export interface PromoCode {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: string;
  max_uses: number | null;
  current_uses: number;
  customer_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PromoCodeInsert {
  id?: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency?: string;
  max_uses?: number | null;
  current_uses?: number;
  customer_id?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface PromoCodeUpdate {
  id?: string;
  code?: string;
  discount_type?: "percent" | "fixed";
  discount_value?: number;
  currency?: string;
  max_uses?: number | null;
  current_uses?: number;
  customer_id?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  created_at?: string;
}

// ── Invoices ──

export interface Invoice {
  id: string;
  order_id: string;
  customer_id: string | null;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  status: "draft" | "issued" | "paid" | "cancelled";
  pdf_url: string | null;
  issued_at: string;
  created_at: string;
}

export interface InvoiceInsert {
  id?: string;
  order_id: string;
  customer_id?: string | null;
  invoice_number?: string;
  amount_cents: number;
  currency?: string;
  status?: "draft" | "issued" | "paid" | "cancelled";
  pdf_url?: string | null;
  issued_at?: string;
  created_at?: string;
}

export interface InvoiceUpdate {
  id?: string;
  order_id?: string;
  customer_id?: string | null;
  invoice_number?: string;
  amount_cents?: number;
  currency?: string;
  status?: "draft" | "issued" | "paid" | "cancelled";
  pdf_url?: string | null;
  issued_at?: string;
  created_at?: string;
}

// ── Pricing ──

export interface Pricing {
  id: string;
  card_type: CardType;
  quantity_min: number;
  quantity_max: number | null;
  price_per_unit_cents: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface PricingInsert {
  id?: string;
  card_type: CardType;
  quantity_min?: number;
  quantity_max?: number | null;
  price_per_unit_cents: number;
  currency?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface PricingUpdate {
  id?: string;
  card_type?: CardType;
  quantity_min?: number;
  quantity_max?: number | null;
  price_per_unit_cents?: number;
  currency?: string;
  is_active?: boolean;
  created_at?: string;
}

// ── Products ──

export type ProductCategory = "cross_photo" | "card_pack" | "accessory" | "print_service";

export interface SizeOption {
  id: string;
  label: string;
  price_cents: number;
}

export interface MaterialOption {
  id: string;
  label: string;
  price_cents: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ProductCategory;
  price_cents: number;
  currency: string;
  requires_photo: boolean;
  size_options: SizeOption[];
  material_options: MaterialOption[];
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  category: ProductCategory;
  price_cents: number;
  currency?: string;
  requires_photo?: boolean;
  size_options?: SizeOption[];
  material_options?: MaterialOption[];
  preview_image_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductUpdate {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  category?: ProductCategory;
  price_cents?: number;
  currency?: string;
  requires_photo?: boolean;
  size_options?: SizeOption[];
  material_options?: MaterialOption[];
  preview_image_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}
