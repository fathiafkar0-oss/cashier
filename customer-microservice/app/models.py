from datetime import datetime
from app.database import db
import bcrypt

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

    def set_password(self, password):
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role.name if self.role else 'customer',
            'username': self.username,
            'email': self.email,
            'phone': self.phone,
            'full_name': self.full_name
        }

class Table(db.Model):
    __tablename__ = 'tables'
    id = db.Column(db.Integer, primary_key=True)
    table_number = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(20), default='AVAILABLE', nullable=False)  # 'AVAILABLE' | 'OCCUPIED'
    capacity = db.Column(db.Integer, default=4, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'table_number': self.table_number,
            'status': self.status,
            'capacity': self.capacity
        }

class Menu(db.Model):
    __tablename__ = 'menus'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), default='Makanan', nullable=False)
    price = db.Column(db.Integer, nullable=False)
    cost_price = db.Column(db.Integer, default=0, nullable=False)  # SENSITIVE: Never expose to customer
    is_available = db.Column(db.Boolean, default=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)  # Soft-delete flag
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    images = db.relationship('MenuImage', backref='menu', lazy=True, cascade="all, delete-orphan")

    def to_customer_dict(self):
        primary_img = next((img.image_url for img in self.images if img.is_primary), None)
        if not primary_img and self.images:
            primary_img = self.images[0].image_url
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'price': self.price,
            'is_available': self.is_available,
            'image_url': primary_img or 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'
        }

class MenuImage(db.Model):
    __tablename__ = 'menu_images'
    id = db.Column(db.Integer, primary_key=True)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    is_primary = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_code = db.Column(db.String(100), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    table_id = db.Column(db.Integer, db.ForeignKey('tables.id'), nullable=False)
    table_number_snapshot = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(30), default='PENDING_PAYMENT', nullable=False)
    total_amount = db.Column(db.Integer, default=0, nullable=False)
    total_cost = db.Column(db.Integer, default=0, nullable=False)
    table_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    table = db.relationship('Table', backref=db.backref('orders', lazy=True))
    customer = db.relationship('User', backref=db.backref('orders', lazy=True))
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")
    payment = db.relationship('Payment', backref='order', uselist=False, lazy=True, cascade="all, delete-orphan")

    def to_customer_dict(self):
        return {
            'id': self.id,
            'order_code': self.order_code,
            'table_id': self.table_id,
            'table_number': self.table_number_snapshot,
            'status': self.status,
            'total_amount': self.total_amount,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'items': [item.to_customer_dict() for item in self.items],
            'payment': self.payment.to_customer_dict() if self.payment else None
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id'), nullable=True)
    menu_name_snapshot = db.Column(db.String(150), nullable=False)
    price_at_order = db.Column(db.Integer, nullable=False)
    cost_price_at_order = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Integer, nullable=False)
    subtotal_cost = db.Column(db.Integer, nullable=False)
    item_notes = db.Column(db.Text)

    def to_customer_dict(self):
        return {
            'id': self.id,
            'menu_id': self.menu_id,
            'menu_name': self.menu_name_snapshot,
            'price': self.price_at_order,
            'quantity': self.quantity,
            'subtotal': self.subtotal,
            'item_notes': self.item_notes
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), unique=True, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)  # 'CASH' | 'CASHLESS'
    payment_status = db.Column(db.String(20), default='UNPAID', nullable=False)  # 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
    amount_due = db.Column(db.Integer, nullable=False)
    amount_received = db.Column(db.Integer, default=0)
    change_amount = db.Column(db.Integer, default=0)
    payment_provider = db.Column(db.String(50))  # 'QRIS' | 'GOPAY' | 'BCA' | 'MANUAL_CASH'
    payment_reference = db.Column(db.String(100))
    paid_at = db.Column(db.DateTime)
    confirmed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_customer_dict(self):
        return {
            'id': self.id,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'amount_due': self.amount_due,
            'amount_received': self.amount_received,
            'change_amount': self.change_amount,
            'payment_provider': self.payment_provider,
            'payment_reference': self.payment_reference,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }
