from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Payment, Order, Table

payment_bp = Blueprint('customer_payments', __name__)

@payment_bp.route('/payments/<int:payment_id>/status', methods=['GET'])
def get_payment_status(payment_id):
    payment = Payment.query.filter_by(id=payment_id).first()
    if not payment:
        return jsonify({'success': False, 'message': 'Payment tidak ditemukan'}), 404

    order = payment.order
    # Cek timeout 15 menit untuk pembayaran cashless pending
    if payment.payment_method == 'CASHLESS' and payment.payment_status == 'PENDING':
        now = datetime.utcnow()
        if payment.created_at and (now - payment.created_at) > timedelta(minutes=15):
            payment.payment_status = 'FAILED'
            if order and order.status == 'PENDING_PAYMENT':
                order.status = 'CANCELLED'
                table = Table.query.filter_by(id=order.table_id).first()
                if table:
                    table.status = 'AVAILABLE'
            db.session.commit()

    return jsonify({
        'success': True,
        'data': {
            'id': payment.id,
            'order_id': payment.order_id,
            'order_code': order.order_code if order else None,
            'payment_method': payment.payment_method,
            'payment_status': payment.payment_status,
            'amount_due': payment.amount_due,
            'amount_received': payment.amount_received,
            'change_amount': payment.change_amount,
            'payment_provider': payment.payment_provider,
            'payment_reference': payment.payment_reference,
            'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
            'order_status': order.status if order else None
        }
    }), 200

@payment_bp.route('/payments/<int:order_id>/switch-to-cash', methods=['POST'])
def switch_to_cash(order_id):
    """Beralih ke pembayaran Cash di kasir jika cashless bermasalah"""
    order = Order.query.filter_by(id=order_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Pesanan tidak ditemukan'}), 404

    if order.status != 'PENDING_PAYMENT':
        return jsonify({'success': False, 'message': 'Hanya pesanan yang belum dibayar yang dapat diubah'}), 400

    payment = order.payment
    if not payment or payment.payment_status == 'PAID':
        return jsonify({'success': False, 'message': 'Pembayaran sudah lunas atau tidak valid'}), 400

    payment.payment_method = 'CASH'
    payment.payment_status = 'UNPAID'
    payment.payment_provider = 'MANUAL_CASH'
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Metode pembayaran dialihkan ke CASH. Silakan lakukan pembayaran di kasir.',
        'data': payment.to_customer_dict()
    }), 200

@payment_bp.route('/payments/mock-cashless-success', methods=['POST'])
def mock_cashless_success():
    """Mock gateway webhook untuk pengujian pembayaran digital"""
    data = request.get_json() or {}
    payment_reference = data.get('payment_reference')

    if not payment_reference:
        return jsonify({'success': False, 'message': 'payment_reference wajib diisi'}), 400

    payment = Payment.query.filter_by(payment_reference=payment_reference).first()
    if not payment:
        return jsonify({'success': False, 'message': 'Data pembayaran tidak ditemukan'}), 404

    if payment.payment_status == 'PAID':
        return jsonify({'success': True, 'message': 'Pembayaran sudah berstatus PAID'}), 200

    payment.payment_status = 'PAID'
    payment.paid_at = datetime.utcnow()
    payment.amount_received = payment.amount_due
    payment.change_amount = 0

    order = payment.order
    if order and order.status == 'PENDING_PAYMENT':
        order.status = 'PROCESSING'

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Simulasi pembayaran cashless BERHASIL diverifikasi',
        'data': payment.to_customer_dict()
    }), 200
