-- ==============================================================================
-- RESTAURANT POS PLATFORM DATABASE SCHEMA (POSTGRESQL / RDS COMPATIBLE)
-- ==============================================================================

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLES TABLE
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE' | 'OCCUPIED'
    capacity INTEGER NOT NULL DEFAULT 4,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. MENUS TABLE (SOFT-DELETE READY)
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'Makanan', -- 'Makanan' | 'Minuman' | 'Cemilan'
    price INTEGER NOT NULL, -- Harga jual (Rupiah)
    cost_price INTEGER NOT NULL DEFAULT 0, -- HPP / Modal awal masakan (Rupiah)
    is_available BOOLEAN NOT NULL DEFAULT TRUE, -- Tersedia / Habis
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Soft-delete flag
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MENU IMAGES TABLE
CREATE TABLE IF NOT EXISTS menu_images (
    id SERIAL PRIMARY KEY,
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(100) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
    table_number_snapshot VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT', -- 'CART' | 'PENDING_PAYMENT' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
    total_amount INTEGER NOT NULL DEFAULT 0,
    total_cost INTEGER NOT NULL DEFAULT 0,
    table_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ORDER ITEMS TABLE (PRICE & COST SNAPSHOT)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_id INTEGER REFERENCES menus(id) ON DELETE SET NULL,
    menu_name_snapshot VARCHAR(150) NOT NULL,
    price_at_order INTEGER NOT NULL,
    cost_price_at_order INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal INTEGER NOT NULL,
    subtotal_cost INTEGER NOT NULL,
    item_notes TEXT
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL, -- 'CASH' | 'CASHLESS'
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID', -- 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
    amount_due INTEGER NOT NULL,
    amount_received INTEGER DEFAULT 0,
    change_amount INTEGER DEFAULT 0,
    payment_provider VARCHAR(50), -- 'QRIS' | 'GOPAY' | 'BCA' | 'MANUAL_CASH'
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TARGETS TABLE (MONTHLY SALES TARGET)
CREATE TABLE IF NOT EXISTS targets (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    target_amount BIGINT NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_month_year UNIQUE (month, year)
);

-- INDEXES FOR PERFORMANCE & RELIABILITY
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_menus_active ON menus(is_active, is_available);
