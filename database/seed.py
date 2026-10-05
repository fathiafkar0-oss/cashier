import os
import bcrypt
from datetime import datetime
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    phone = db.Column(db.String(50))
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    role = db.relationship('Role', backref='users')

class Table(db.Model):
    __tablename__ = 'tables'
    id = db.Column(db.Integer, primary_key=True)
    table_number = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(20), default='AVAILABLE', nullable=False)
    capacity = db.Column(db.Integer, default=4, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Menu(db.Model):
    __tablename__ = 'menus'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), default='Makanan', nullable=False)
    price = db.Column(db.Integer, nullable=False)
    cost_price = db.Column(db.Integer, default=0, nullable=False)
    is_available = db.Column(db.Boolean, default=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MenuImage(db.Model):
    __tablename__ = 'menu_images'
    id = db.Column(db.Integer, primary_key=True)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    is_primary = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Target(db.Model):
    __tablename__ = 'targets'
    id = db.Column(db.Integer, primary_key=True)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    target_amount = db.Column(db.BigInteger, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('month', 'year', name='unique_month_year'),)

def hash_pw(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_database(db_uri=None):
    app = Flask(__name__)
    uri = db_uri or os.environ.get('DATABASE_URL', 'sqlite:///restaurant_pos.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    with app.app_context():
        db.create_all()

        # 1. Seed Roles
        role_map = {}
        for role_name, desc in [
            ('admin', 'Administrator Restoran - Akses Menu, HPP, Finansial & Target'),
            ('cashier', 'Kasir Restoran - Akses Antrean Order, Pembayaran Cash & Cashless'),
            ('customer', 'Pelanggan Restoran - Akses Menu Publik, Meja & Self-Ordering')
        ]:
            role = Role.query.filter_by(name=role_name).first()
            if not role:
                role = Role(name=role_name, description=desc)
                db.session.add(role)
                db.session.flush()
            role_map[role_name] = role

        # 2. Seed Users
        demo_users = [
            {
                'username': 'admin',
                'email': 'admin@resto.com',
                'phone': '081111111111',
                'password': 'password123',
                'full_name': 'Admin Restoran Demo',
                'role': 'admin'
            },
            {
                'username': 'kasir',
                'email': 'kasir@resto.com',
                'phone': '082222222222',
                'password': 'password123',
                'full_name': 'Kasir Restoran Demo',
                'role': 'cashier'
            },
            {
                'username': 'customer',
                'email': 'customer@resto.com',
                'phone': '083333333333',
                'password': 'password123',
                'full_name': 'Pelanggan Restoran Demo',
                'role': 'customer'
            }
        ]

        admin_user_id = None
        for u in demo_users:
            existing = User.query.filter_by(username=u['username']).first()
            if not existing:
                usr = User(
                    role_id=role_map[u['role']].id,
                    username=u['username'],
                    email=u['email'],
                    phone=u['phone'],
                    password_hash=hash_pw(u['password']),
                    full_name=u['full_name'],
                    is_active=True
                )
                db.session.add(usr)
                db.session.flush()
                if u['role'] == 'admin':
                    admin_user_id = usr.id
            else:
                if u['role'] == 'admin':
                    admin_user_id = existing.id

        # 3. Seed Tables (Meja 01 s/d Meja 10)
        table_configs = [
            ('Meja 01', 2), ('Meja 02', 2), ('Meja 03', 4), ('Meja 04', 4), ('Meja 05', 4),
            ('Meja 06', 4), ('Meja 07', 6), ('Meja 08', 6), ('Meja 09', 8), ('Meja 10', 8)
        ]
        for t_num, cap in table_configs:
            if not Table.query.filter_by(table_number=t_num).first():
                db.session.add(Table(table_number=t_num, capacity=cap, status='AVAILABLE'))

        # 4. Seed Menus
        sample_menus = [
            # Makanan
            ('Nasi Goreng Spesial', 'Nasi goreng harum dengan telur mata sapi, suwiran ayam, acar, dan kerupuk renyah.', 'Makanan', 25000, 14000, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80'),
            ('Ayam Bakar Madu', 'Ayam panggang bumbu madu gurih manis disajikan dengan sambal terasi dan lalapan segar.', 'Makanan', 32000, 18000, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80'),
            ('Mie Goreng Seafood', 'Mie kuning kenyal dengan udang, cumi, bakso ikan, dan sayuran segar bumbu rempah pilihan.', 'Makanan', 28000, 16000, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80'),
            ('Sate Ayam Madura', '10 tusuk sate ayam empuk berbalut bumbu kacang kental khas Madura dengan taburan bawang goreng.', 'Makanan', 30000, 17000, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80'),
            ('Ikan Nila Bakar Jimbaran', 'Ikan nila segar dibakar dengan olesan bumbu Jimbaran khas Bali, pedas manis gurih.', 'Makanan', 35000, 20000, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80'),

            # Minuman
            ('Es Teh Manis', 'Teh melati seduh segar dengan gula tebu asli dan es batu dingin menyegarkan.', 'Minuman', 5000, 1500, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80'),
            ('Es Jeruk Peras Segar', 'Jeruk peras murni kaya vitamin C dengan sirup gula alami dan es serut dingin.', 'Minuman', 8000, 3000, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80'),
            ('Kopi Susu Gula Aren', 'Espresso double shot dipadu susu segar creamy dan sirup gula aren organik premium.', 'Minuman', 18000, 8000, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80'),
            ('Jus Alpukat Coklat', 'Alpukat mentega kental di-blender halus dengan lelehan susu kental manis coklat lezat.', 'Minuman', 15000, 7000, 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600&auto=format&fit=crop&q=80'),
            ('Air Mineral Dingin 600ml', 'Air mineral pegunungan botol higienis dan menyegarkan.', 'Minuman', 4000, 1500, 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&auto=format&fit=crop&q=80'),

            # Cemilan
            ('Kentang Goreng Crispy', 'French fries renyah keemasan dibumbui garam laut gurih, disajikan dengan saus tomat & mayones.', 'Cemilan', 15000, 7000, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80'),
            ('Pisang Bakar Coklat Keju', 'Pisang raja bakar harum ditaburi meses coklat pekat dan parutan keju cheddar melimpah.', 'Cemilan', 16000, 8000, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80'),
            ('Tempe Mendoan Gurih', '5 lembar tempe kedelai mendoan khas Banyumas hangat dengan sambal kecap rawit pedas.', 'Cemilan', 12000, 5000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80')
        ]

        for name, desc, cat, price, cost, img_url in sample_menus:
            menu = Menu.query.filter_by(name=name).first()
            if not menu:
                menu = Menu(
                    name=name,
                    description=desc,
                    category=cat,
                    price=price,
                    cost_price=cost,
                    is_available=True,
                    is_active=True
                )
                db.session.add(menu)
                db.session.flush()

                img = MenuImage(menu_id=menu.id, image_url=img_url, is_primary=True)
                db.session.add(img)

        # 5. Seed Target Bulanan Saat Ini
        now = datetime.utcnow()
        current_target = Target.query.filter_by(month=now.month, year=now.year).first()
        if not current_target:
            db.session.add(Target(
                month=now.month,
                year=now.year,
                target_amount=50000000, # Rp50.000.000
                created_by=admin_user_id
            ))

        db.session.commit()
        print("Database seeded successfully with Roles, Users, Tables, Menus, and Monthly Target!")

if __name__ == '__main__':
    seed_database()
