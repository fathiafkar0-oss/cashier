import pytest
from app import create_app
from app.database import db
from app.models import Role, User, Table, Menu, MenuImage, Order, Payment

@pytest.fixture
def client():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test_jwt_secret_customer'
    })

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Seed test data
            role_cust = Role(name='customer', description='Customer')
            role_admin = Role(name='admin', description='Admin')
            db.session.add_all([role_cust, role_admin])
            db.session.flush()

            u1 = User(role_id=role_cust.id, username='budi', email='budi@gmail.com', full_name='Budi Santoso')
            u1.set_password('budi123')
            u2 = User(role_id=role_cust.id, username='siti', email='siti@gmail.com', full_name='Siti Rahma')
            u2.set_password('siti123')
            db.session.add_all([u1, u2])

            t1 = Table(table_number='Meja 01', capacity=4, status='AVAILABLE')
            t2 = Table(table_number='Meja 02', capacity=2, status='AVAILABLE')
            db.session.add_all([t1, t2])

            m1 = Menu(name='Nasi Goreng', category='Makanan', price=25000, cost_price=14000, is_available=True, is_active=True)
            m2 = Menu(name='Es Teh', category='Minuman', price=5000, cost_price=1500, is_available=True, is_active=True)
            m3 = Menu(name='Menu Habis', category='Makanan', price=20000, cost_price=10000, is_available=False, is_active=True)
            db.session.add_all([m1, m2, m3])
            db.session.commit()

        yield client

def test_health_check(client):
    res = client.get('/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'customer-microservice'

def test_menu_catalog_hides_cost_price(client):
    res = client.get('/api/customer/menus')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert len(data['data']) == 2  # Only m1 and m2, m3 is unavailable
    for item in data['data']:
        assert 'cost_price' not in item
        assert 'price' in item

def test_table_availability(client):
    res = client.get('/api/customer/tables/available')
    assert res.status_code == 200
    data = res.get_json()['data']
    assert len(data) == 2
    assert data[0]['status'] == 'AVAILABLE'

def test_order_creation_and_table_lock(client):
    # Login budi
    login_res = client.post('/api/customer/auth/login', json={'username': 'budi', 'password': 'budi123'})
    token = login_res.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}

    # Create order
    payload = {
        'table_id': 1,
        'payment_method': 'CASH',
        'table_confirmed': True,
        'notes': 'Sedang',
        'items': [
            {'menu_id': 1, 'quantity': 2, 'item_notes': 'Pedas'},
            {'menu_id': 2, 'quantity': 1, 'item_notes': 'Manis'}
        ]
    }
    res = client.post('/api/customer/orders', json=payload, headers=headers)
    assert res.status_code == 201
    order_data = res.get_json()['data']
    assert order_data['status'] == 'PENDING_PAYMENT'
    assert order_data['total_amount'] == 55000  # (25000*2) + (5000*1)
    assert order_data['table_number'] == 'Meja 01'
    assert order_data['payment']['payment_status'] == 'UNPAID'
    assert order_data['payment']['amount_due'] == 55000

    # Test table status changed to OCCUPIED
    tables_res = client.get('/api/customer/tables/available')
    avail = tables_res.get_json()['data']
    assert len(avail) == 1
    assert avail[0]['table_number'] == 'Meja 02'

    # Test Double Booking Prevention
    res_conflict = client.post('/api/customer/orders', json=payload, headers=headers)
    assert res_conflict.status_code == 409
    assert 'sudah digunakan' in res_conflict.get_json()['message']

def test_order_requires_table_confirmed(client):
    payload = {
        'table_id': 2,
        'payment_method': 'CASH',
        'table_confirmed': False,
        'items': [{'menu_id': 1, 'quantity': 1}]
    }
    res = client.post('/api/customer/orders', json=payload)
    assert res.status_code == 400
    assert 'wajib disetujui' in res.get_json()['message']

def test_order_ownership_security(client):
    # Budi creates order
    login_budi = client.post('/api/customer/auth/login', json={'username': 'budi', 'password': 'budi123'})
    token_budi = login_budi.get_json()['data']['token']

    res = client.post('/api/customer/orders', json={
        'table_id': 2,
        'payment_method': 'CASH',
        'table_confirmed': True,
        'items': [{'menu_id': 1, 'quantity': 1}]
    }, headers={'Authorization': f'Bearer {token_budi}'})
    order_id = res.get_json()['data']['id']

    # Siti tries to access Budi's order
    login_siti = client.post('/api/customer/auth/login', json={'username': 'siti', 'password': 'siti123'})
    token_siti = login_siti.get_json()['data']['token']

    res_hack = client.get(f'/api/customer/orders/{order_id}', headers={'Authorization': f'Bearer {token_siti}'})
    assert res_hack.status_code == 403
