import pytest
from app import create_app
from app.database import db
from app.models import Role, User, Table, Menu, Order, OrderItem, Payment, Target

@pytest.fixture
def client():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test_jwt_secret_employee_32_bytes_len'
    })

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Seed roles
            role_admin = Role(name='admin', description='Admin')
            role_cashier = Role(name='cashier', description='Cashier')
            role_cust = Role(name='customer', description='Customer')
            db.session.add_all([role_admin, role_cashier, role_cust])
            db.session.flush()

            # Seed users
            u_admin = User(role_id=role_admin.id, username='admin', email='admin@resto.com', full_name='Admin Boss')
            u_admin.set_password('admin123')
            u_cashier = User(role_id=role_cashier.id, username='kasir', email='kasir@resto.com', full_name='Kasir Front')
            u_cashier.set_password('kasir123')
            u_cust = User(role_id=role_cust.id, username='customer', email='cust@resto.com', full_name='Cust Biasa')
            u_cust.set_password('cust123')
            db.session.add_all([u_admin, u_cashier, u_cust])

            # Seed tables
            t1 = Table(table_number='Meja 01', capacity=4, status='AVAILABLE')
            t2 = Table(table_number='Meja 02', capacity=2, status='AVAILABLE')
            db.session.add_all([t1, t2])

            # Seed menus
            m1 = Menu(name='Nasi Goreng', category='Makanan', price=25000, cost_price=14000, is_available=True, is_active=True)
            m2 = Menu(name='Ayam Bakar', category='Makanan', price=30000, cost_price=18000, is_available=True, is_active=True)
            db.session.add_all([m1, m2])
            db.session.commit()

        yield client

def get_auth_token(client, username, password):
    res = client.post('/api/employee/auth/login', json={'username': username, 'password': password})
    assert res.status_code == 200
    return res.get_json()['data']['token']

def test_health_check(client):
    res = client.get('/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'employee-microservice'

def test_rbac_customer_blocked_from_employee_login(client):
    res = client.post('/api/employee/auth/login', json={'username': 'customer', 'password': 'cust123'})
    assert res.status_code == 403
    assert 'khusus Karyawan' in res.get_json()['message']

def test_rbac_cashier_blocked_from_admin_reports_and_menu_crud(client):
    kasir_token = get_auth_token(client, 'kasir', 'kasir123')
    headers = {'Authorization': f'Bearer {kasir_token}'}

    # Kasir tries to view financial reports -> 403
    res_rep = client.get('/api/employee/admin/reports/summary', headers=headers)
    assert res_rep.status_code == 403

    # Kasir tries to create menu -> 403
    res_menu = client.post('/api/employee/admin/menus', json={'name': 'Menu Ilegal', 'price': 10000}, headers=headers)
    assert res_menu.status_code == 403

def test_admin_menu_crud_with_hpp_and_soft_delete(client):
    admin_token = get_auth_token(client, 'admin', 'admin123')
    headers = {'Authorization': f'Bearer {admin_token}'}

    # Create menu
    res = client.post('/api/employee/admin/menus', json={
        'name': 'Bebek Goreng',
        'category': 'Makanan',
        'price': 35000,
        'cost_price': 20000,
        'description': 'Gurih'
    }, headers=headers)
    assert res.status_code == 201
    menu_data = res.get_json()['data']
    assert menu_data['margin'] == 15000
    assert menu_data['cost_price'] == 20000
    menu_id = menu_data['id']

    # Soft delete
    res_del = client.delete(f'/api/employee/admin/menus/{menu_id}', headers=headers)
    assert res_del.status_code == 200

    # Verify menu is soft-deleted
    with client.application.app_context():
        m = db.session.get(Menu, menu_id)
        assert m.is_active is False
        assert m.is_available is False

def test_cashier_payment_validation_and_change_calculation(client):
    # Setup order in DB directly
    with client.application.app_context():
        t1 = Table.query.filter_by(table_number='Meja 01').first()
        t1.status = 'OCCUPIED'
        order = Order(
            order_code='ORD-TEST-001',
            table_id=t1.id,
            table_number_snapshot='Meja 01',
            status='PENDING_PAYMENT',
            total_amount=37000,
            total_cost=20000,
            table_confirmed=True
        )
        db.session.add(order)
        db.session.flush()

        payment = Payment(
            order_id=order.id,
            payment_method='CASH',
            payment_status='UNPAID',
            amount_due=37000,
            payment_provider='MANUAL_CASH',
            payment_reference='REF-ORD-TEST-001'
        )
        db.session.add(payment)
        db.session.commit()
        pay_id = payment.id
        ord_id = order.id

    kasir_token = get_auth_token(client, 'kasir', 'kasir123')
    headers = {'Authorization': f'Bearer {kasir_token}'}

    # Test insufficient cash -> must reject
    res_fail = client.post(f'/api/employee/cashier/payments/{pay_id}/confirm-cash', json={'amount_received': 30000}, headers=headers)
    assert res_fail.status_code == 400
    assert 'kurang dari total tagihan' in res_fail.get_json()['message']

    # Test sufficient cash (50000 for 37000)
    res_ok = client.post(f'/api/employee/cashier/payments/{pay_id}/confirm-cash', json={'amount_received': 50000}, headers=headers)
    assert res_ok.status_code == 200
    data = res_ok.get_json()['data']
    assert data['change_amount'] == 13000
    assert data['payment']['payment_status'] == 'PAID'
    assert data['order_status'] == 'PROCESSING'

    # Finish order (status -> COMPLETED)
    res_comp = client.patch(f'/api/employee/cashier/orders/{ord_id}/status', json={'status': 'COMPLETED'}, headers=headers)
    assert res_comp.status_code == 200
    assert res_comp.get_json()['data']['status'] == 'COMPLETED'

    # Verify table released to AVAILABLE
    with client.application.app_context():
        t1 = Table.query.filter_by(table_number='Meja 01').first()
        assert t1.status == 'AVAILABLE'

def test_financial_report_and_profit_calculation(client):
    # Setup 1 PAID order and 1 UNPAID order
    with client.application.app_context():
        t1 = Table.query.filter_by(table_number='Meja 01').first()
        o1 = Order(
            order_code='ORD-PAID-01',
            table_id=t1.id,
            table_number_snapshot='Meja 01',
            status='COMPLETED',
            total_amount=50000,
            total_cost=30000,
            table_confirmed=True
        )
        p1 = Payment(order=o1, payment_method='CASH', payment_status='PAID', amount_due=50000, amount_received=50000, change_amount=0)

        o2 = Order(
            order_code='ORD-UNPAID-02',
            table_id=t1.id,
            table_number_snapshot='Meja 01',
            status='PENDING_PAYMENT',
            total_amount=40000,
            total_cost=25000,
            table_confirmed=True
        )
        p2 = Payment(order=o2, payment_method='CASH', payment_status='UNPAID', amount_due=40000)

        db.session.add_all([o1, p1, o2, p2])
        db.session.commit()

    admin_token = get_auth_token(client, 'admin', 'admin123')
    headers = {'Authorization': f'Bearer {admin_token}'}

    res = client.get('/api/employee/admin/reports/summary', headers=headers)
    assert res.status_code == 200
    data = res.get_json()['data']

    # ONLY o1 (PAID) should be counted! o2 (UNPAID) must be ignored
    assert data['total_omzet'] == 50000
    assert data['total_cost'] == 30000
    assert data['total_profit'] == 20000
    assert data['total_transactions'] == 1
