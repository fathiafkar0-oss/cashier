import random
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Order, OrderItem, Payment, Table, Menu
from app.auth import optional_token, token_required

order_bp = Blueprint('customer_orders', __name__)

def generate_order_code():
    today_str = datetime.utcnow().strftime('%Y%m%d')
    rand_suffix = f"{random.randint(1000, 9999)}"
    return f"ORD-{today_str}-{rand_suffix}"

@order_bp.route('/orders', methods=['POST'])
@optional_token
def create_order(current_user):
    data = request.get_json() or {}

    table_id = data.get('table_id')
    payment_method = (data.get('payment_method') or 'CASH').upper()
    table_confirmed = data.get('table_confirmed', False)
    notes = data.get('notes', '')
    items_data = data.get('items', [])

    # 1. Validasi Meja
    if not table_id:
        return jsonify({'success': False, 'message': 'Nomor meja wajib dipilih'}), 400

    if not table_confirmed:
        return jsonify({
            'success': False,
            'message': 'Pernyataan konfirmasi meja wajib disetujui sebelum transaksi'
        }), 400

    if payment_method not in ['CASH', 'CASHLESS']:
        return jsonify({'success': False, 'message': 'Metode pembayaran harus CASH atau CASHLESS'}), 400

    if not items_data or not isinstance(items_data, list):
        return jsonify({'success': False, 'message': 'Keranjang belanja tidak boleh kosong'}), 400

    try:
        # Atomic lock check pada meja
        table = Table.query.filter_by(id=table_id).with_for_update().first()
        if not table:
            return jsonify({'success': False, 'message': 'Meja tidak ditemukan'}), 404

        if table.status != 'AVAILABLE':
            return jsonify({
                'success': False,
                'message': f'Meja {table.table_number} sudah digunakan oleh pelanggan lain'
            }), 409

        # 2. Validasi Items & Kalkulasi Server-Side Mutlak
        order_items_objs = []
        total_amount = 0
        total_cost = 0

        for idx, it in enumerate(items_data):
            menu_id = it.get('menu_id')
            qty = it.get('quantity', 0)
            item_notes = it.get('item_notes', '')

            try:
                qty = int(qty)
            except (ValueError, TypeError):
                qty = 0

            if qty <= 0:
                return jsonify({'success': False, 'message': f'Quantity item ke-{idx+1} tidak valid'}), 400

            menu = Menu.query.filter_by(id=menu_id, is_active=True).first()
            if not menu:
                return jsonify({'success': False, 'message': f'Menu id {menu_id} tidak ditemukan'}), 400

            if not menu.is_available:
                return jsonify({
                    'success': False,
                    'message': f'Menu "{menu.name}" saat ini tidak tersedia atau habis'
                }), 400

            subtotal = menu.price * qty
            subtotal_cost = menu.cost_price * qty
            total_amount += subtotal
            total_cost += subtotal_cost

            # Snapshot harga & modal saat order dibuat
            order_items_objs.append(OrderItem(
                menu_id=menu.id,
                menu_name_snapshot=menu.name,
                price_at_order=menu.price,
                cost_price_at_order=menu.cost_price,
                quantity=qty,
                subtotal=subtotal,
                subtotal_cost=subtotal_cost,
                item_notes=item_notes
            ))

        # 3. Kunci Meja (Table Lock)
        table.status = 'OCCUPIED'

        # 4. Generate Order Code
        order_code = generate_order_code()
        while Order.query.filter_by(order_code=order_code).first():
            order_code = generate_order_code()

        # 5. Buat Order
        customer_id = current_user.id if current_user else None
        order = Order(
            order_code=order_code,
            customer_id=customer_id,
            table_id=table.id,
            table_number_snapshot=table.table_number,
            status='PENDING_PAYMENT',
            total_amount=total_amount,
            total_cost=total_cost,
            table_confirmed=True,
            notes=notes
        )
        db.session.add(order)
        db.session.flush()

        for oi in order_items_objs:
            oi.order_id = order.id
            db.session.add(oi)

        # 6. Buat Record Payment
        initial_pay_status = 'UNPAID' if payment_method == 'CASH' else 'PENDING'
        provider = 'MANUAL_CASH' if payment_method == 'CASH' else 'QRIS'
        payment = Payment(
            order_id=order.id,
            payment_method=payment_method,
            payment_status=initial_pay_status,
            amount_due=total_amount,
            amount_received=0,
            change_amount=0,
            payment_provider=provider,
            payment_reference=f"REF-{order_code}"
        )
        db.session.add(payment)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Pesanan berhasil dibuat',
            'data': order.to_customer_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Gagal membuat order: {str(e)}'}), 500

@order_bp.route('/orders/<int:order_id>', methods=['GET'])
@optional_token
def get_order(current_user, order_id):
    order = Order.query.filter_by(id=order_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Pesanan tidak ditemukan'}), 404

    # Ownership check: jika user terautentikasi dan bukan pemilik order
    if current_user and order.customer_id and order.customer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Anda tidak berhak mengakses pesanan ini'}), 403

    return jsonify({
        'success': True,
        'data': order.to_customer_dict()
    }), 200

@order_bp.route('/orders/code/<string:order_code>', methods=['GET'])
@optional_token
def get_order_by_code(current_user, order_code):
    order = Order.query.filter_by(order_code=order_code).first()
    if not order:
        return jsonify({'success': False, 'message': 'Pesanan tidak ditemukan'}), 404

    if current_user and order.customer_id and order.customer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Anda tidak berhak mengakses pesanan ini'}), 403

    return jsonify({
        'success': True,
        'data': order.to_customer_dict()
    }), 200

@order_bp.route('/orders/my-orders', methods=['GET'])
@token_required
def get_my_orders(current_user):
    orders = Order.query.filter_by(customer_id=current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [o.to_customer_dict() for o in orders]
    }), 200
