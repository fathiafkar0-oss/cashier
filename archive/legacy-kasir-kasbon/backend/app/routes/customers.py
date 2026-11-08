from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Customer, DebtPayment
from app.auth import token_required

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/customers', methods=['GET'])
@token_required
def get_customers(current_user):
    customers = Customer.query.filter_by(user_id=current_user.id).order_by(Customer.name).all()
    return jsonify([c.to_dict() for c in customers]), 200

@customers_bp.route('/customers', methods=['POST'])
@token_required
def create_customer(current_user):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Nama pelanggan wajib diisi.'}), 400

    name = data.get('name').strip()
    existing_customer = Customer.query.filter_by(name=name, user_id=current_user.id).first()
    if existing_customer:
        return jsonify({'error': f'Pelanggan dengan nama "{name}" sudah terdaftar di buku kasbon Anda.'}), 400

    customer = Customer(name=name, total_debt=0, user_id=current_user.id)
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201

@customers_bp.route('/customers/<int:customer_id>/pay-debt', methods=['POST'])
@token_required
def pay_debt(current_user, customer_id):
    customer = Customer.query.filter_by(id=customer_id, user_id=current_user.id).first()
    if not customer:
        return jsonify({'error': 'Data pelanggan tidak ditemukan.'}), 404

    data = request.get_json()
    if not data or data.get('amount') is None:
        return jsonify({'error': 'Nominal pembayaran wajib diisi.'}), 400

    amount = int(data.get('amount'))
    if amount <= 0:
        return jsonify({'error': 'Nominal pembayaran harus lebih dari 0.'}), 400

    if amount > customer.total_debt:
        return jsonify({'error': f'Jumlah pembayaran ({amount}) melebihi total utang pelanggan ({customer.total_debt}).'}), 400

    try:
        # Tambahkan catatan pembayaran
        payment = DebtPayment(customer_id=customer_id, amount=amount)
        db.session.add(payment)

        # Kurangi utang pelanggan
        customer.total_debt -= amount
        
        db.session.commit()
        return jsonify({
            'message': 'Pembayaran kasbon berhasil dicatat.',
            'customer': customer.to_dict(),
            'payment': payment.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal mencatat pembayaran kasbon: {str(e)}'}), 500

@customers_bp.route('/customers/<int:customer_id>/history', methods=['GET'])
@token_required
def get_customer_history(current_user, customer_id):
    customer = Customer.query.filter_by(id=customer_id, user_id=current_user.id).first()
    if not customer:
        return jsonify({'error': 'Data pelanggan tidak ditemukan.'}), 404

    # Ambil transaksi kasbon
    from app.models import Transaction
    transactions = Transaction.query.filter_by(
        customer_id=customer_id,
        user_id=current_user.id,
        payment_method='kasbon'
    ).order_by(Transaction.created_at.desc()).all()

    # Ambil riwayat pembayaran hutang
    payments = DebtPayment.query.filter_by(
        customer_id=customer_id
    ).order_by(DebtPayment.created_at.desc()).all()

    timeline = []

    for trx in transactions:
        items = []
        for d in trx.details:
            items.append({
                'product_name': d.product.name if d.product else (d.custom_name or 'Barang Lain'),
                'quantity': d.quantity,
                'price': d.price,
                'subtotal': d.quantity * d.price
            })
        
        timeline.append({
            'id': f"trx-{trx.id}",
            'type': 'debt',
            'title': f"Kasbon #{trx.transaction_code}",
            'transaction_code': trx.transaction_code,
            'amount': trx.total_amount,
            'amount_paid': trx.amount_paid,
            'created_at': trx.created_at.isoformat(),
            'items': items,
            'item_count': sum(i['quantity'] for i in items)
        })

    for p in payments:
        timeline.append({
            'id': f"pay-{p.id}",
            'type': 'payment',
            'title': 'Pembayaran Kasbon / Cicilan',
            'amount': p.amount,
            'created_at': p.created_at.isoformat(),
            'items': []
        })

    # Urutkan timeline berdasarkan tanggal terbaru
    timeline.sort(key=lambda x: x['created_at'], reverse=True)

    return jsonify({
        'customer': customer.to_dict(),
        'total_debt': customer.total_debt,
        'timeline': timeline,
        'transaction_count': len(transactions),
        'payment_count': len(payments)
    }), 200

