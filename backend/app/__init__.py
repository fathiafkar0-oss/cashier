import os
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
from app.database import db

def create_app():
    app = Flask(__name__)
    
    # Konfigurasi database URI dan JWT key dari env (menggunakan SQLite jika tidak ada DATABASE_URL)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 'sqlite:///cashier.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get(
        'JWT_SECRET_KEY', 'supersecretjwtkey12345'
    )

    # Inisialisasi library pendukung
    db.init_app(app)
    Migrate(app, db)
    CORS(app)  # Izinkan CORS untuk mempermudah komunikasi dengan frontend

    # Registrasi blueprint/routes
    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.transactions import transactions_bp
    from app.routes.customers import customers_bp
    from app.routes.reports import reports_bp
    from app.routes.expenses import expenses_bp

    # Daftarkan semua route di bawah prefiks /api
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(products_bp, url_prefix='/api')
    app.register_blueprint(transactions_bp, url_prefix='/api')
    app.register_blueprint(customers_bp, url_prefix='/api')
    app.register_blueprint(reports_bp, url_prefix='/api')
    app.register_blueprint(expenses_bp, url_prefix='/api')

    # Otomatis membuat tabel dan seed data jika kosong saat startup
    with app.app_context():
        db.create_all()
        # Pastikan kolom-kolom baru pada tabel products ada jika database lama digunakan
        try:
            from sqlalchemy import text, inspect
            insp = inspect(db.engine)
            # 1. Tabel users
            if 'users' in insp.get_table_names():
                user_cols = [c['name'] for c in insp.get_columns('users')]
                if 'email' not in user_cols:
                    db.session.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(120) UNIQUE;"))
                if 'store_name' not in user_cols:
                    db.session.execute(text("ALTER TABLE users ADD COLUMN store_name VARCHAR(150);"))
                if 'failed_login_attempts' not in user_cols:
                    db.session.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;"))
                if 'locked_until' not in user_cols:
                    db.session.execute(text("ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;"))

            # 2. Tabel products
            if 'products' in insp.get_table_names():
                cols = [c['name'] for c in insp.get_columns('products')]
                if 'user_id' not in cols:
                    db.session.execute(text("ALTER TABLE products ADD COLUMN user_id INTEGER REFERENCES users(id);"))
                if 'category' not in cols:
                    db.session.execute(text("ALTER TABLE products ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Lainnya';"))
                if 'is_retail' not in cols:
                    db.session.execute(text("ALTER TABLE products ADD COLUMN is_retail BOOLEAN NOT NULL DEFAULT FALSE;"))
                if 'retail_group' not in cols:
                    db.session.execute(text("ALTER TABLE products ADD COLUMN retail_group VARCHAR(10);"))
                if 'half_pack_price' not in cols:
                    db.session.execute(text("ALTER TABLE products ADD COLUMN half_pack_price INTEGER;"))
                if 'pack_size' not in cols:
                    db.session.execute(text("ALTER TABLE products ADD COLUMN pack_size INTEGER DEFAULT 16;"))

            # 3. Tabel customers
            if 'customers' in insp.get_table_names():
                cust_cols = [c['name'] for c in insp.get_columns('customers')]
                if 'user_id' not in cust_cols:
                    db.session.execute(text("ALTER TABLE customers ADD COLUMN user_id INTEGER REFERENCES users(id);"))
                # Drop single-tenant unique constraint on customer name if exists
                try:
                    db.session.execute(text("ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_name_key;"))
                except Exception:
                    pass

            # 4. Tabel transactions
            if 'transactions' in insp.get_table_names():
                trans_cols = [c['name'] for c in insp.get_columns('transactions')]
                if 'user_id' not in trans_cols:
                    db.session.execute(text("ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id);"))

            # 5. Tabel expenses
            if 'expenses' in insp.get_table_names():
                exp_cols = [c['name'] for c in insp.get_columns('expenses')]
                if 'user_id' not in exp_cols:
                    db.session.execute(text("ALTER TABLE expenses ADD COLUMN user_id INTEGER REFERENCES users(id);"))

            # 6. Tabel transaction_details (Dukungan barang manual / custom)
            if 'transaction_details' in insp.get_table_names():
                td_cols = [c['name'] for c in insp.get_columns('transaction_details')]
                if 'custom_name' not in td_cols:
                    db.session.execute(text("ALTER TABLE transaction_details ADD COLUMN custom_name VARCHAR(255);"))
                try:
                    db.session.execute(text("ALTER TABLE transaction_details ALTER COLUMN product_id DROP NOT NULL;"))
                except Exception:
                    pass

            # 7. Drop products single-tenant unique sku constraint if exists
            try:
                db.session.execute(text("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;"))
            except Exception:
                pass

            db.session.commit()
        except Exception:
            db.session.rollback()

        from app.seed import seed_db
        seed_db()

    return app
