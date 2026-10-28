-- ==============================================================================
-- SMART POS & WHOLESALE MANAGEMENT SYSTEM - RELATIONAL DATABASE SCHEMA (PostgreSQL / Supabase / Cloud SQL)
-- Complete schema with Primary Keys, Foreign Keys, Indexes, Constraints, and Cascade Rules
-- ==============================================================================

-- 1. Roles and Permissions
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    can_read BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    role_id VARCHAR(50) REFERENCES roles(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_code VARCHAR(10),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categories & Warehouses
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    color VARCHAR(30),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    location TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    tax_id VARCHAR(50),
    address TEXT,
    current_payable NUMERIC(15,2) DEFAULT 0.00,
    credit_days INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Products & Product Units & Price Tiers
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    base_unit VARCHAR(50) NOT NULL,
    cost_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    wholesale_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    wholesale_min_qty INT NOT NULL DEFAULT 10,
    current_stock NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    min_stock_alert NUMERIC(15,2) NOT NULL DEFAULT 10.00,
    warehouse_id VARCHAR(50) REFERENCES warehouses(id) ON DELETE SET NULL,
    supplier_id VARCHAR(50) REFERENCES suppliers(id) ON DELETE SET NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_units (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    unit_name VARCHAR(50) NOT NULL,
    multiplier NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    barcode VARCHAR(100),
    retail_price NUMERIC(15,2),
    wholesale_price NUMERIC(15,2)
);

CREATE TABLE IF NOT EXISTS price_tiers (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    min_qty INT NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    label VARCHAR(100)
);

-- 6. Customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    tax_id VARCHAR(50),
    address TEXT,
    customer_type VARCHAR(50) DEFAULT 'RETAIL' CHECK (customer_type IN ('RETAIL', 'WHOLESALE_A', 'WHOLESALE_B', 'VIP')),
    price_tier_discount_percent NUMERIC(5,2) DEFAULT 0.00,
    credit_limit NUMERIC(15,2) DEFAULT 0.00,
    credit_days INT DEFAULT 0,
    current_debt NUMERIC(15,2) DEFAULT 0.00,
    total_purchased NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Cash Shifts (Sessions)
CREATE TABLE IF NOT EXISTS cash_sessions (
    id VARCHAR(50) PRIMARY KEY,
    cashier_id VARCHAR(50) REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    opening_cash NUMERIC(15,2) NOT NULL,
    expected_cash NUMERIC(15,2) NOT NULL,
    actual_cash NUMERIC(15,2),
    cash_difference NUMERIC(15,2),
    total_sales NUMERIC(15,2) DEFAULT 0.00,
    total_cash_sales NUMERIC(15,2) DEFAULT 0.00,
    total_promptpay_sales NUMERIC(15,2) DEFAULT 0.00,
    total_credit_sales NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    notes TEXT
);

-- 8. Sales & Sale Items
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    cashier_id VARCHAR(50) REFERENCES users(id),
    customer_id VARCHAR(50) REFERENCES customers(id),
    subtotal NUMERIC(15,2) NOT NULL,
    discount_total NUMERIC(15,2) DEFAULT 0.00,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 7.00,
    grand_total NUMERIC(15,2) NOT NULL,
    total_cost NUMERIC(15,2) NOT NULL,
    gross_profit NUMERIC(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'CANCELLED', 'REFUNDED')),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by VARCHAR(50) REFERENCES users(id),
    session_id VARCHAR(50) REFERENCES cash_sessions(id),
    is_credit_sale BOOLEAN DEFAULT FALSE,
    is_debt_paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR(50) PRIMARY KEY,
    sale_id VARCHAR(50) REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id),
    unit VARCHAR(50) NOT NULL,
    quantity NUMERIC(15,2) NOT NULL,
    unit_cost NUMERIC(15,2) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    discount NUMERIC(15,2) DEFAULT 0.00,
    total NUMERIC(15,2) NOT NULL,
    tier_applied VARCHAR(100)
);

-- 9. Stock Movements (Inventory Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id VARCHAR(50) REFERENCES warehouses(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('PURCHASE_RECEIPT', 'SALE', 'SALE_CANCEL', 'ADJUST_DAMAGE', 'ADJUST_COUNT', 'TRANSFER_IN', 'TRANSFER_OUT')),
    quantity_change NUMERIC(15,2) NOT NULL,
    quantity_before NUMERIC(15,2) NOT NULL,
    quantity_after NUMERIC(15,2) NOT NULL,
    reference_id VARCHAR(100),
    reason TEXT,
    unit_cost NUMERIC(15,2),
    user_id VARCHAR(50) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Purchase Orders & Items
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(50) PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id VARCHAR(50) REFERENCES suppliers(id),
    subtotal NUMERIC(15,2) NOT NULL,
    shipping_fee NUMERIC(15,2) DEFAULT 0.00,
    other_fees NUMERIC(15,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'RECEIVED', 'CANCELLED')),
    is_paid BOOLEAN DEFAULT FALSE,
    paid_amount NUMERIC(15,2) DEFAULT 0.00,
    received_at TIMESTAMP WITH TIME ZONE,
    received_by VARCHAR(50) REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id VARCHAR(50) PRIMARY KEY,
    po_id VARCHAR(50) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id),
    unit VARCHAR(50) NOT NULL,
    quantity NUMERIC(15,2) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    total NUMERIC(15,2) NOT NULL
);

-- 11. Financial Transactions & Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('SALE_INCOME', 'CUSTOMER_DEBT_PAYMENT', 'CAPITAL_INJECTION', 'EXPENSE', 'SUPPLIER_PAYMENT', 'OWNER_DRAW')),
    category VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    note TEXT,
    recorded_by VARCHAR(50) REFERENCES users(id),
    session_id VARCHAR(50) REFERENCES cash_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Settings
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for High Performance POS & Wholesale Queries
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_sales_receipt ON sales(receipt_number);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_stock_movements_prod ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_expenses_date ON expenses(date);
