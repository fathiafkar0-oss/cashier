from datetime import datetime
from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Order, Payment, Table, Menu
from app.auth import token_required, roles_required

cashier_bp = Blueprint('employee_cashier', __name__)

@cashier_bp.route('/cashier/orders', methods=['GET'])
@token_required
@roles_required(['cashier', 'admin'])
def get_orders(current_user):
    status_filter = request.args.get('status')
    query = Order.query

    if status_filter:
        query = query.filter_by(status=status_filter)

    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [o.to_dict() for o in orders]
    }), 200

@cashier_bp.route('/cashier/orders/<int:order_id>', methods=['GET'])
@token_required
@roles_required(['cashier', 'admin'])
def get_order_detail(current_user, order_id):
    order = Order.query.filter_by(id=order_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Pesanan tidak ditemukan'}), 404

    return jsonify({
        'success': True,
        'data': order.to_dict()
    }), 200

@cashier_bp.route('/cashier/payments/<int:payment_id>/confirm-cash', methods=['POST'])
@token_required
@roles_required(['cashier', 'admin'])
def confirm_cash_payment(current_user, payment_id):
    data = request.get_json() or {}
    amount_received = data.get('amount_received')

    if amount_received is None:
        return jsonify({'success': False, 'message': 'Nominal uang diterima wajib diisi'}), 400

    try:
        amount_received = int(amount_received)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Format nominal uang tidak valid'}), 400

    payment = Payment.query.filter_by(id=payment_id).first()
    if not payment:
        return jsonify({'success': False, 'message': 'Data pembayaran tidak ditemukan'}), 404

    if payment.payment_method != 'CASH':
        return jsonify({'success': False, 'message': 'Endpoint ini hanya untuk pembayaran metode CASH'}), 400

    if payment.payment_status == 'PAID':
        return jsonify({'success': False, 'message': 'Pembayaran ini sudah berstatus PAID sebelumnya'}), 400

    if amount_received < payment.amount_due:
        return jsonify({
            'success': False,
            'message': f'Uang yang diterima (Rp{amount_received:,}) kurang dari total tagihan (Rp{payment.amount_due:,})'
        }), 400

    # Server-Side Calculation Otoritatif
    change_amount = amount_received - payment.amount_due

    payment.amount_received = amount_received
    payment.change_amount = change_amount
    payment.payment_status = 'PAID'
    payment.paid_at = datetime.utcnow()
    payment.confirmed_by = current_user.id

    order = payment.order
    if order:
        order.status = 'PROCESSING'

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Pembayaran CASH berhasil dikonfirmasi. Kembalian: Rp{change_amount:,}',
        'data': {
            'payment': payment.to_dict(),
            'change_amount': change_amount,
            'order_status': order.status if order else None
        }
    }), 200

@cashier_bp.route('/cashier/payments/<int:payment_id>/verify-cashless', methods=['POST'])
@token_required
@roles_required(['cashier', 'admin'])
def verify_cashless_payment(current_user, payment_id):
    payment = Payment.query.filter_by(id=payment_id).first()
    if not payment:
        return jsonify({'success': False, 'message': 'Data pembayaran tidak ditemukan'}), 404

    if payment.payment_method != 'CASHLESS':
        return jsonify({'success': False, 'message': 'Metode pembayaran bukan CASHLESS'}), 400

    if payment.payment_status == 'PAID':
        return jsonify({'success': True, 'message': 'Pembayaran sudah lunas'}), 200

    payment.payment_status = 'PAID'
    payment.paid_at = datetime.utcnow()
    payment.amount_received = payment.amount_due
    payment.change_amount = 0
    payment.confirmed_by = current_user.id

    order = payment.order
    if order:
        order.status = 'PROCESSING'

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Pembayaran CASHLESS berhasil diverifikasi kasir',
        'data': payment.to_dict()
    }), 200

@cashier_bp.route('/cashier/orders/<int:order_id>/status', methods=['PATCH'])
@token_required
@roles_required(['cashier', 'admin'])
def update_order_status(current_user, order_id):
    data = request.get_json() or {}
    new_status = data.get('status')

    valid_statuses = ['PROCESSING', 'COMPLETED', 'CANCELLED']
    if new_status not in valid_statuses:
        return jsonify({
            'success': False,
            'message': f'Status tidak valid. Pilihan: {", ".join(valid_statuses)}'
        }), 400

    order = Order.query.filter_by(id=order_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Pesanan tidak ditemukan'}), 404

    order.status = new_status

    # Jika order selesai atau dibatalkan, lepaskan status meja menjadi AVAILABLE
    if new_status in ['COMPLETED', 'CANCELLED']:
        table = Table.query.filter_by(id=order.table_id).first()
        if table:
            table.status = 'AVAILABLE'

        if new_status == 'CANCELLED' and order.payment and order.payment.payment_status != 'PAID':
            order.payment.payment_status = 'FAILED'

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Status pesanan berhasil diperbarui menjadi {new_status}',
        'data': order.to_dict()
    }), 200

@cashier_bp.route('/cashier/orders/<int:order_id>/change-table', methods=['POST'])
@token_required
@roles_required(['cashier', 'admin'])
def change_order_table(current_user, order_id):
    data = request.get_json() or {}
    new_table_id = data.get('new_table_id')

    if not new_table_id:
        return jsonify({'success': False, 'message': 'new_table_id wajib diisi'}), 400

    order = Order.query.filter_by(id=order_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Pesanan tidak ditemukan'}), 404

    if order.status not in ['PENDING_PAYMENT', 'PROCESSING']:
        return jsonify({'success': False, 'message': 'Meja hanya dapat dipindahkan untuk pesanan aktif'}), 400

    new_table = Table.query.filter_by(id=new_table_id).first()
    if not new_table:
        return jsonify({'success': False, 'message': 'Meja tujuan tidak ditemukan'}), 404

    if new_table.status != 'AVAILABLE':
        return jsonify({'success': False, 'message': f'Meja {new_table.table_number} sedang digunakan'}), 409

    # Lepas meja lama
    old_table = Table.query.filter_by(id=order.table_id).first()
    if old_table:
        old_table.status = 'AVAILABLE'

    # Tempati meja baru
    new_table.status = 'OCCUPIED'
    order.table_id = new_table.id
    order.table_number_snapshot = new_table.table_number

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Pesanan berhasil dipindahkan ke {new_table.table_number}',
        'data': order.to_dict()
    }), 200

@cashier_bp.route('/menus/<int:menu_id>/toggle-availability', methods=['PATCH'])
@token_required
@roles_required(['cashier', 'admin'])
def toggle_menu_availability(current_user, menu_id):
    menu = Menu.query.filter_by(id=menu_id).first()
    if not menu:
        return jsonify({'success': False, 'message': 'Menu tidak ditemukan'}), 404

    menu.is_available = not menu.is_available
    db.session.commit()

    status_str = "Tersedia" if menu.is_available else "Habis"
    return jsonify({
        'success': True,
        'message': f'Status menu "{menu.name}" diubah menjadi {status_str}',
        'data': {
            'id': menu.id,
            'name': menu.name,
            'is_available': menu.is_available
        }
    }), 200
