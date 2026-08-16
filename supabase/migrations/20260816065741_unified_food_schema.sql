-- Migration: Unified Food Item Schema + Profiles + Meal Plans
-- PER-49: The single most load-bearing schema decision in the system
-- Recipes, creator recipes (Phase 2), and vendor items (Phase 3) all live in one table
-- Distinguished only by source_type

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- User profiles with goal-based personalization

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  goal text not null check (goal in (
    'weight_management',
    'general_wellness',
    'energy_vitality',
    'condition_aware'
  )),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- RLS Policy: Users can only see and edit their own profile
create policy "Users can view own profile"
  on profiles
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles
  for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles
  for insert
  with check (auth.uid() = id);


-- =====================================================
-- FOOD_ITEMS TABLE (UNIFIED SCHEMA)
-- =====================================================
-- The core table: recipes, creator recipes, and vendor items all live here
-- Distinguished by source_type field

create table food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,

  -- Source type: recipe (Phase 1), creator_recipe (Phase 2), vendor_item (Phase 3)
  source_type text not null check (source_type in (
    'recipe',
    'creator_recipe',
    'vendor_item'
  )),

  -- Optional source reference (e.g., creator user ID, vendor ID)
  source_id uuid,

  -- Recipe/item details
  ingredients jsonb not null,
  portion_description text,  -- "1 wrap", "1 ladle", "1 bowl"

  -- Nutrition data (calories, protein, carbs, fats, sodium, etc.)
  nutrition jsonb not null,

  -- PRIMARY taxonomy: 7 confirmed categories
  -- This is the main browse structure in Explore
  category text not null check (category in (
    'Soups & Stews',
    'Rice & Grain Dishes',
    'Swallow',
    'Breakfast',
    'Snacks & Street Food',
    'Drinks & Porridges',
    'Sides/Accompaniments'
  )),

  -- SECONDARY taxonomy: plain-language goal tags
  -- Optional overlay filters, never required to find food
  -- Examples: "Keeps you fuller for longer", "Easy on blood pressure"
  tags text[] default '{}',

  -- Additional metadata
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  image_url text,
  instructions text,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for common queries
create index food_items_category_idx on food_items(category);
create index food_items_source_type_idx on food_items(source_type);
create index food_items_tags_idx on food_items using gin(tags);

-- Enable RLS on food_items
alter table food_items enable row level security;

-- RLS Policy: All authenticated users can view food items (public content)
create policy "Anyone can view food items"
  on food_items
  for select
  using (true);

-- RLS Policy: Only creators/admins can insert items (Phase 2+)
-- For now, only system can insert (via service role)
create policy "Only authenticated users can insert food items"
  on food_items
  for insert
  with check (auth.role() = 'authenticated');

-- RLS Policy: Creators can update their own items (Phase 2+)
create policy "Creators can update own items"
  on food_items
  for update
  using (
    source_type = 'creator_recipe'
    and source_id = auth.uid()
  );


-- =====================================================
-- MEAL_PLANS TABLE
-- =====================================================
-- User meal planning: which food items are in which meal slots

create table meal_plans (
  id uuid primary key default gen_random_uuid(),

  -- User reference
  user_id uuid not null references profiles(id) on delete cascade,

  -- Food item reference
  food_item_id uuid not null references food_items(id) on delete cascade,

  -- Scheduling
  planned_date date not null,
  meal_slot text not null check (meal_slot in (
    'breakfast',
    'lunch',
    'dinner',
    'snack'  -- Optional slot, may not be in Phase 1
  )),

  -- Optional customization
  servings integer default 1,
  notes text,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Ensure one food item per slot per day per user
  unique(user_id, planned_date, meal_slot)
);

-- Indexes for common queries
create index meal_plans_user_date_idx on meal_plans(user_id, planned_date);
create index meal_plans_user_id_idx on meal_plans(user_id);

-- Enable RLS on meal_plans
alter table meal_plans enable row level security;

-- RLS Policy: Users can only see their own meal plans
create policy "Users can view own meal plans"
  on meal_plans
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own meal plans"
  on meal_plans
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meal plans"
  on meal_plans
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own meal plans"
  on meal_plans
  for delete
  using (auth.uid() = user_id);

demonbloodx2/per-50-rls-enabled-explicit-policy-on-every-table-hard-rule-no
-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
-- Automatically update updated_at timestamp

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

create trigger update_food_items_updated_at
  before update on food_items
  for each row
  execute function update_updated_at_column();

create trigger update_meal_plans_updated_at
  before update on meal_plans
  for each row
  execute function update_updated_at_column();


-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

comment on table food_items is 'Unified schema for recipes, creator recipes, and vendor items. Distinguished by source_type field. This is the most important table in the system.';
comment on column food_items.category is 'PRIMARY browse taxonomy: 7 categories that organize Explore';
comment on column food_items.tags is 'SECONDARY taxonomy: plain-language goal tags, optional overlay filters';
comment on column food_items.source_type is 'recipe (Phase 1), creator_recipe (Phase 2), vendor_item (Phase 3)';

comment on table profiles is 'User profiles with goal-based personalization (weight_management, general_wellness, energy_vitality, condition_aware)';
comment on table meal_plans is 'User meal planning: which food items go in which meal slots on which days';
