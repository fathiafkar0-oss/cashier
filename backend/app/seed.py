from app.database import db
from app.models import User, Product, Customer

def seed_db():
    # 1. Hapus akun bawaan default 'admin' jika ada agar aman
    old_admin = User.query.filter((User.username == 'admin') | (User.email == 'admin@toko.com')).first()
    if old_admin:
        # Jika akun default lama ada, hapus agar sistem bersih dan menggunakan akun registrasi mandiri
        try:
            db.session.delete(old_admin)
            db.session.commit()
            print("Old default admin user removed.")
        except Exception:
            db.session.rollback()

    # 2. Add some dummy products if table is empty
    if Product.query.count() == 0:
        products = [
            Product(sku='8999999000123', name='Beras Pandan Wangi 5kg', price=75000, cost_price=65000, stock=20, min_stock=5, category='Sembako'),
            Product(sku='8999999000456', name='Minyak Goreng 2L', price=36000, cost_price=30000, stock=15, min_stock=5, category='Sembako'),
            Product(sku='8999999000789', name='Gula Pasir 1kg', price=14500, cost_price=12500, stock=30, min_stock=8, category='Sembako'),
            Product(sku='8999999000321', name='Mie Instan Rasa Soto', price=3100, cost_price=2600, stock=120, min_stock=20, category='Makanan'),
            Product(sku='8999999000654', name='Teh Celup Kotak', price=6500, cost_price=5000, stock=4, min_stock=5, category='Minuman'),  # Stok kritis (< min_stock)
            # Rokok Eceran
            Product(sku='8999999000999', name='Magnum Filter 16', price=26000, cost_price=13000, stock=160, min_stock=48, category='Rokok', is_retail=True, retail_group='A', half_pack_price=14000, pack_size=16),
            Product(sku='8999999000888', name='Esse Change 20', price=32000, cost_price=28000, stock=200, min_stock=60, category='Rokok', is_retail=True, retail_group='B', half_pack_price=17500, pack_size=20),
            Product(sku='8999999000777', name='Sampoerna Mild 16', price=30000, cost_price=25000, stock=80, min_stock=32, category='Rokok', is_retail=True, retail_group='A', half_pack_price=16000, pack_size=16),
        ]
        db.session.bulk_save_objects(products)
        print("Initial products seeded.")

    # 3. Add some dummy customers if empty
    if Customer.query.count() == 0:
        customers = [
            Customer(name='Budi Santoso', total_debt=50000),
            Customer(name='Siti Aminah', total_debt=0),
            Customer(name='Ahmad Hidayat', total_debt=120000),
        ]
        db.session.bulk_save_objects(customers)
        print("Initial customers seeded.")

    db.session.commit()
