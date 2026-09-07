from flask import Blueprint, jsonify
from app.database import db
from app.models import Customer, Transaction, DebtPayment, Expense
from app.auth import token_required

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports/summary', methods=['GET'])
@token_required
def get_report_summary(current_user):
    # 1. Total piutang kasbon aktif untuk user ini
    total_receivables = db.session.query(db.func.sum(Customer.total_debt))\
        .filter(Customer.user_id == current_user.id).scalar() or 0

    # 2. Total pemasukan tunai/debit dari penjualan langsung user ini
    total_sales_income = db.session.query(db.func.sum(Transaction.total_amount))\
        .filter(Transaction.user_id == current_user.id, Transaction.payment_method.in_(['cash', 'debit'])).scalar() or 0

    # 3. Total pemasukan dari cicilan/pelunasan kasbon pelanggan user ini
    total_debt_payments = db.session.query(db.func.sum(DebtPayment.amount))\
        .join(Customer, DebtPayment.customer_id == Customer.id)\
        .filter(Customer.user_id == current_user.id).scalar() or 0

    # Total pengeluaran operasional user ini
    total_expense = db.session.query(db.func.sum(Expense.amount))\
        .filter(Expense.user_id == current_user.id).scalar() or 0

    # Pemasukan bersih = total penjualan tunai/debit + total pembayaran kasbon - pengeluaran
    total_income = total_sales_income + total_debt_payments - total_expense

    # 4. Ambil arus kas masuk terbaru (recent movements) milik user ini
    # Penjualan langsung (tunai/debit)
    sales = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        Transaction.payment_method.in_(['cash', 'debit'])
    ).order_by(Transaction.created_at.desc()).limit(20).all()
    
    # Pembayaran kasbon pelanggan milik user ini
    payments = DebtPayment.query.join(Customer, DebtPayment.customer_id == Customer.id)\
        .filter(Customer.user_id == current_user.id)\
        .order_by(DebtPayment.created_at.desc()).limit(20).all()

    # Transaksi kasbon baru
    kasbons = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        Transaction.payment_method == 'kasbon'
    ).order_by(Transaction.created_at.desc()).limit(15).all()

    # Gabungkan dan urutkan
    movements = []
    for s in sales:
        movements.append({
            'type': 'sale',
            'description': f"Penjualan ({s.payment_method.upper()}) - {s.transaction_code}",
            'amount': s.total_amount,
            'created_at': s.created_at.isoformat()
        })
        
    for p in payments:
        movements.append({
            'type': 'debt_payment',
            'description': f"Pembayaran Kasbon - {p.customer.name if p.customer else 'Pelanggan'}",
            'amount': p.amount,
            'created_at': p.created_at.isoformat()
        })

    for k in kasbons:
        movements.append({
            'type': 'kasbon',
            'description': f"Kasbon ({k.customer.name if k.customer else 'Pelanggan'}) - {k.transaction_code}",
            'amount': k.total_amount,
            'created_at': k.created_at.isoformat()
        })

    # Urutkan berdasarkan waktu terbaru
    movements.sort(key=lambda x: x['created_at'], reverse=True)
    recent_movements = movements[:25]


    return jsonify({
        'total_income': total_income,
        'total_receivables': total_receivables,
        'total_expense': total_expense,
        'recent_movements': recent_movements
    }), 200
