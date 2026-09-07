from flask import Blueprint, request, jsonify
from datetime import datetime
from app.database import db
from app.models import Product, Customer, Transaction, TransactionDetail, Expense, DebtPayment
from app.auth import token_required

transactions_bp = Blueprint('transactions', __name__)

def generate_transaction_code(user_id):
    today_str = datetime.utcnow().strftime('%Y%m%d')
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    count = Transaction.query.filter(Transaction.user_id == user_id, Transaction.created_at >= today_start).count()
    seq = count + 1
    while True:
        candidate = f"TR-{today_str}-{user_id:03d}-{str(seq).zfill(4)}"
        if not Transaction.query.filter_by(transaction_code=candidate).first():
            return candidate
        seq += 1

def calculate_retail_price(product, quantity):
    if not product.is_retail:
        return product.price * quantity

    pack_size = product.pack_size or 16
    pack_price = product.price
    half_pack_size = pack_size // 2
    half_pack_price = product.half_pack_price

    total = 0
    remaining = quantity

    # 1. Hitung kelipatan bungkus utuh
    packs = remaining // pack_size
    total += packs * pack_price
    remaining %= pack_size

    # 2. Hitung setengah bungkus
    if half_pack_price and remaining >= half_pack_size:
        total += half_pack_price
        remaining -= half_pack_size

    # 3. Hitung sisa batang eceran
    retail_price = 0
    if remaining > 0:
        if product.retail_group == 'A':
            rates = [0, 3000, 5000, 7000, 10000]
            groups_of_4 = remaining // 4
            rem_4 = remaining % 4
            retail_price = (groups_of_4 * 10000) + rates[rem_4]
        elif product.retail_group == 'B':
            rates = [0, 2000, 4000, 5000, 7000]
            groups_of_4 = remaining // 4
            rem_4 = remaining % 4
            retail_price = (groups_of_4 * 7000) + rates[rem_4]
        elif product.retail_group == 'C':
            retail_price = remaining * 2000
        else:
            unit_price = pack_price // pack_size
            retail_price = remaining * unit_price

    total += retail_price
    return total

@transactions_bp.route('/transactions', methods=['POST'])
@token_required
def create_transaction(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Tidak ada data transaksi.'}), 400

    payment_method = data.get('payment_method')
    if payment_method not in ['cash', 'kasbon']:
        return jsonify({'error': 'Metode pembayaran tidak valid. Hanya menerima Tunai dan Kasbon.'}), 400

    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'Keranjang belanja tidak boleh kosong.'}), 400

    customer_id = data.get('customer_id')
    customer = None
    if payment_method == 'kasbon':
        if not customer_id:
            return jsonify({'error': 'Pelanggan wajib dipilih untuk metode kasbon.'}), 400
        customer = Customer.query.filter_by(id=customer_id, user_id=current_user.id).first()
        if not customer:
            return jsonify({'error': 'Pelanggan tidak ditemukan di toko Anda.'}), 404

    # Validasi Pembayaran
    amount_paid = int(data.get('amount_paid', 0))
    
    # Inisialisasi detail transaksi & hitung total
    total_amount = 0
    items_to_process = []
    
    try:
        # Loop pertama: validasi kecukupan stok & hitung harga
        for item in items:
            raw_product_id = item.get('product_id')
            quantity = int(item.get('quantity', 0))
            if quantity <= 0:
                return jsonify({'error': 'Kuantitas barang harus lebih dari 0.'}), 400

            # Cek apakah item adalah produk katalog atau barang manual
            is_custom = False
            product = None
            if raw_product_id is None or str(raw_product_id).startswith('custom_'):
                is_custom = True
            else:
                try:
                    p_id = int(raw_product_id)
                    product = Product.query.filter_by(id=p_id, user_id=current_user.id).first()
                except (ValueError, TypeError):
                    is_custom = True

            if not is_custom and product:
                if product.stock < quantity:
                    return jsonify({'error': f'Stok barang "{product.name}" tidak mencukupi (Tersisa: {product.stock}).'}), 400

                # Hitung harga item (eceran jika rokok eceran)
                if product.is_retail:
                    item_price = calculate_retail_price(product, quantity)
                    sold_unit_price = item_price // quantity
                    unit_cost = product.cost_price // (product.pack_size or 16)
                else:
                    item_price = product.price * quantity
                    sold_unit_price = product.price
                    unit_cost = product.cost_price

                total_amount += item_price
                items_to_process.append({
                    'product': product,
                    'is_custom': False,
                    'quantity': quantity,
                    'unit_price': sold_unit_price,
                    'cost_price': unit_cost,
                    'custom_name': None
                })
            else:
                # Barang manual / custom kalkulator
                custom_name = item.get('name') or 'Barang Lain'
                unit_price = int(item.get('price', 0))
                if unit_price <= 0:
                    return jsonify({'error': f'Harga untuk "{custom_name}" harus lebih dari 0.'}), 400
                item_price = unit_price * quantity
                total_amount += item_price
                items_to_process.append({
                    'product': None,
                    'is_custom': True,
                    'quantity': quantity,
                    'unit_price': unit_price,
                    'cost_price': 0,
                    'custom_name': custom_name
                })

        # Jika cash, pastikan uang pembayaran cukup
        if payment_method == 'cash':
            if amount_paid < total_amount:
                return jsonify({'error': f'Uang pembayaran kurang. Total: {total_amount}, Dibayar: {amount_paid}'}), 400
            change_amount = amount_paid - total_amount
        else: # Kasbon
            amount_paid = 0
            change_amount = 0

        # Mulai tulis ke database
        transaction_code = generate_transaction_code(current_user.id)
        transaction = Transaction(
            user_id=current_user.id,
            transaction_code=transaction_code,
            payment_method=payment_method,
            total_amount=total_amount,
            amount_paid=amount_paid,
            change_amount=change_amount,
            customer_id=customer_id if payment_method == 'kasbon' else None
        )
        db.session.add(transaction)
        db.session.flush() # Mendapatkan ID transaksi

        # Loop kedua: pemotongan stok & simpan detail
        for proc in items_to_process:
            detail = TransactionDetail(
                transaction_id=transaction.id,
                product_id=proc['product'].id if proc['product'] else None,
                custom_name=proc['custom_name'],
                quantity=proc['quantity'],
                price=proc['unit_price'],
                cost_price=proc['cost_price']
            )
            db.session.add(detail)
            
            # Potong stok jika produk katalog
            if proc['product']:
                proc['product'].stock -= proc['quantity']

        # Update utang pelanggan jika kasbon
        if payment_method == 'kasbon' and customer:
            customer.total_debt += total_amount

        db.session.commit()

        return jsonify(transaction.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal memproses transaksi: {str(e)}'}), 500

@transactions_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.created_at.desc()).all()
    return jsonify([t.to_dict() for t in transactions]), 200

@transactions_bp.route('/history', methods=['GET'])
@token_required
def get_unified_history(current_user):
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.created_at.desc()).all()
    expenses = Expense.query.filter_by(user_id=current_user.id).order_by(Expense.created_at.desc()).all()
    
    # Ambil catatan pembayaran kasbon dari pelanggan toko user ini
    debt_payments = DebtPayment.query.join(Customer, DebtPayment.customer_id == Customer.id)\
        .filter(Customer.user_id == current_user.id)\
        .order_by(DebtPayment.created_at.desc()).all()
    
    unified = []

    # 1. Transaksi Penjualan (Tunai vs Kasbon)
    for t in transactions:
        if t.payment_method == 'cash':
            unified.append({
                'id': f"trx-{t.id}",
                'raw_id': t.id,
                'type': 'income', # Arus Kas Masuk
                'flow_type': 'sale_cash',
                'transaction_code': t.transaction_code,
                'payment_method': 'cash',
                'category_label': 'Tunai',
                'customer_name': t.customer.name if t.customer else None,
                'amount': t.total_amount,
                'amount_paid': t.amount_paid,
                'change_amount': t.change_amount,
                'details': [d.to_dict() for d in t.details],
                'created_at': t.created_at.isoformat()
            })
        elif t.payment_method == 'kasbon':
            unified.append({
                'id': f"trx-{t.id}",
                'raw_id': t.id,
                'type': 'kasbon', # Piutang (bukan arus kas masuk langsung)
                'flow_type': 'kasbon_created',
                'transaction_code': t.transaction_code,
                'payment_method': 'kasbon',
                'category_label': 'Kasbon',
                'customer_name': t.customer.name if t.customer else 'Pelanggan',
                'amount': t.total_amount,
                'amount_paid': 0,
                'change_amount': 0,
                'details': [d.to_dict() for d in t.details],
                'created_at': t.created_at.isoformat()
            })
        else:
            unified.append({
                'id': f"trx-{t.id}",
                'raw_id': t.id,
                'type': 'income',
                'flow_type': 'sale_other',
                'transaction_code': t.transaction_code,
                'payment_method': t.payment_method,
                'category_label': t.payment_method.capitalize(),
                'customer_name': t.customer.name if t.customer else None,
                'amount': t.total_amount,
                'amount_paid': t.amount_paid,
                'change_amount': t.change_amount,
                'details': [d.to_dict() for d in t.details],
                'created_at': t.created_at.isoformat()
            })
        
    # 2. Pembayaran Kasbon Pelanggan -> Arus Kas Masuk (Pemasukan Kas)
    for p in debt_payments:
        unified.append({
            'id': f"pay-{p.id}",
            'raw_id': p.id,
            'type': 'income', # Arus Kas Masuk
            'flow_type': 'debt_payment',
            'transaction_code': f"BAYAR-KASBON-{p.id:04d}",
            'payment_method': 'debt_payment',
            'category_label': 'Pembayaran Kasbon',
            'customer_name': p.customer.name if p.customer else 'Pelanggan',
            'customer_total_debt': p.customer.total_debt if p.customer else 0,
            'amount': p.amount,
            'amount_paid': p.amount,
            'change_amount': 0,
            'details': [],
            'created_at': p.created_at.isoformat()
        })

    # 3. Pengeluaran Operasional -> Arus Kas Keluar (Pengeluaran)
    for e in expenses:
        unified.append({
            'id': f"exp-{e.id}",
            'raw_id': e.id,
            'type': 'expense', # Arus Kas Keluar
            'flow_type': 'expense',
            'transaction_code': 'PENGELUARAN',
            'category': e.category,
            'category_label': e.category,
            'description': e.description,
            'amount': e.amount,
            'created_at': e.created_at.isoformat()
        })
        
    unified.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify(unified), 200

