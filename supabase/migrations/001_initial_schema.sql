-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Enums
create type source_type as enum ('ebay', 'vinted', 'in_person', 'other');
create type condition_type as enum ('new', 'excellent', 'good', 'satisfactory');
create type item_status as enum ('in_stock', 'listed', 'sold');
create type listing_status as enum ('draft', 'scheduled', 'live', 'sold', 'deleted');
create type platform_type as enum ('vinted', 'ebay', 'depop');
create type bank_source_type as enum ('starling');

-- purchases
create table purchases (
  id uuid primary key default gen_random_uuid(),
  source source_type not null,
  source_order_id text,
  purchase_date date not null default current_date,
  total_cost decimal(10,2) not null,
  item_count int not null default 1,
  notes text,
  receipt_image_url text,
  created_at timestamptz not null default now()
);

-- inventory_items (SKUs)
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  purchase_id uuid references purchases(id) on delete set null,
  cost_price decimal(10,2) not null default 0,
  description text,
  brand text,
  category text,
  size text,
  condition condition_type,
  colour text,
  pit_to_pit decimal(5,1),
  length decimal(5,1),
  storage_location text,
  photos text[] not null default '{}',
  status item_status not null default 'in_stock',
  created_at timestamptz not null default now()
);

create index inventory_items_status_idx on inventory_items(status);
create index inventory_items_purchase_id_idx on inventory_items(purchase_id);

-- listings
create table listings (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references inventory_items(id) on delete cascade,
  vinted_item_id text,
  platform platform_type not null default 'vinted',
  list_price decimal(10,2) not null,
  ai_description text,
  listed_at timestamptz,
  scheduled_at timestamptz,
  status listing_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index listings_sku_id_idx on listings(sku_id);
create index listings_status_idx on listings(status);

-- orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  vinted_order_id text not null unique,
  listing_id uuid references listings(id) on delete set null,
  sku_id uuid not null references inventory_items(id) on delete restrict,
  sale_price decimal(10,2) not null,
  platform_fee decimal(10,2) not null default 0,
  shipping_cost decimal(10,2) not null default 0,
  net_revenue decimal(10,2) generated always as (sale_price - platform_fee - shipping_cost) stored,
  profit decimal(10,2),
  margin_percent decimal(5,2),
  sold_at timestamptz not null default now(),
  shipment_label_url text,
  created_at timestamptz not null default now()
);

create index orders_sku_id_idx on orders(sku_id);
create index orders_sold_at_idx on orders(sold_at);

-- offer_rules
create table offer_rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  min_accept_percent int not null default 80,
  counter_percent int not null default 90,
  auto_reject_below int not null default 60,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- bank_snapshots
create table bank_snapshots (
  id uuid primary key default gen_random_uuid(),
  source bank_source_type not null default 'starling',
  balance decimal(12,2) not null,
  currency text not null default 'GBP',
  snapshot_at timestamptz not null default now()
);

create index bank_snapshots_snapshot_at_idx on bank_snapshots(snapshot_at desc);

-- RLS: enable for all tables (single user app — authenticated users only)
alter table purchases enable row level security;
alter table inventory_items enable row level security;
alter table listings enable row level security;
alter table orders enable row level security;
alter table offer_rules enable row level security;
alter table bank_snapshots enable row level security;

-- Policies: allow all operations for authenticated users
create policy "authenticated users can do everything" on purchases for all using (auth.role() = 'authenticated');
create policy "authenticated users can do everything" on inventory_items for all using (auth.role() = 'authenticated');
create policy "authenticated users can do everything" on listings for all using (auth.role() = 'authenticated');
create policy "authenticated users can do everything" on orders for all using (auth.role() = 'authenticated');
create policy "authenticated users can do everything" on offer_rules for all using (auth.role() = 'authenticated');
create policy "authenticated users can do everything" on bank_snapshots for all using (auth.role() = 'authenticated');

-- Function to generate SKU
create or replace function generate_sku(purchase_date date default current_date)
returns text
language plpgsql
as $$
declare
  date_str text;
  seq int;
  sku text;
begin
  date_str := to_char(purchase_date, 'YYYYMMDD');
  select count(*) + 1 into seq from inventory_items where sku like 'TH-' || date_str || '-%';
  sku := 'TH-' || date_str || '-' || lpad(seq::text, 4, '0');
  return sku;
end;
$$;
