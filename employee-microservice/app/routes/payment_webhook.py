from datetime import datetime
from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Payment, Order

webhook_bp = Blueprint('employee_webhook', __name__)

@webhook_bp.route('/payments/webhook', methods=['POST'])
def payment_webhook():
    """Endpoint webhook callback untuk payment provider eksternal"""
    data = request.get_json() or {}
    payment_reference = data.get('payment_reference')
    status = data.get('status', 'SUCCESS').upper()

    if not payment_reference:
        return jsonify({'success': False, 'message': 'payment_reference wajib diisi'}), 400

    payment = Payment.query.filter_by(payment_reference=payment_reference).first()
    if not payment:
        return jsonify({'success': False, 'message': 'Transaksi pembayaran tidak ditemukan'}), 404

    order = payment.order

    if status == 'SUCCESS':
        payment.payment_status = 'PAID'
        payment.paid_at = datetime.utcnow()
        payment.amount_received = payment.amount_due
        payment.change_amount = 0
        if order and order.status == 'PENDING_PAYMENT':
            order.status = 'PROCESSING'
        message = 'Pembayaran berhasil dikonfirmasi via webhook'
    elif status in ['FAILED', 'EXPIRED']:
        payment.payment_status = 'FAILED'
        if order and order.status == 'PENDING_PAYMENT':
            order.status = 'CANCELLED'
            if order.table:
                order.table.status = 'AVAILABLE'
        message = f'Pembayaran {status.lower()} via webhook'
    else:
        return jsonify({'success': False, 'message': 'Status webhook tidak dikenali'}), 400

    db.session.commit()

    return jsonify({
        'success': True,
        'message': message,
        'data': payment.to_dict()
    }), 200
