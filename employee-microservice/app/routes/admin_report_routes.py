from datetime import datetime, date
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app.database import db
from app.models import Order, Payment, Target
from app.auth import token_required, roles_required

admin_report_bp = Blueprint('employee_admin_report', __name__)

@admin_report_bp.route('/admin/reports/summary', methods=['GET'])
@token_required
@roles_required(['admin'])
def get_report_summary(current_user):
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    payment_method = request.args.get('payment_method')

    # Query dasar: HANYA transaksi yang sah dibayar (PAID) dan tidak dibatalkan
    query = Order.query.join(Payment).filter(
        Payment.payment_status == 'PAID',
        Order.status.in_(['PROCESSING', 'COMPLETED'])
    )

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            query = query.filter(Order.created_at >= start_date)
        except ValueError:
            pass

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str + ' 23:59:59', '%Y-%m-%d %H:%M:%S')
            query = query.filter(Order.created_at <= end_date)
        except ValueError:
            pass

    if payment_method:
        query = query.filter(Payment.payment_method == payment_method.upper())

    valid_orders = query.all()

    total_omzet = sum(o.total_amount for o in valid_orders)
    total_cost = sum(o.total_cost for o in valid_orders)
    total_profit = total_omzet - total_cost
    total_transactions = len(valid_orders)

    # Rincian Cash vs Cashless
    cash_orders = [o for o in valid_orders if o.payment and o.payment.payment_method == 'CASH']
    cashless_orders = [o for o in valid_orders if o.payment and o.payment.payment_method == 'CASHLESS']

    cash_omzet = sum(o.total_amount for o in cash_orders)
    cashless_omzet = sum(o.total_amount for o in cashless_orders)

    # Target Bulanan Saat Ini
    now = datetime.utcnow()
    target_record = Target.query.filter_by(month=now.month, year=now.year).first()
    target_amount = target_record.target_amount if target_record else 0

    # Omzet bulan berjalan untuk perhitungan achievement
    month_start = datetime(now.year, now.month, 1)
    month_orders = Order.query.join(Payment).filter(
        Payment.payment_status == 'PAID',
        Order.status.in_(['PROCESSING', 'COMPLETED']),
        Order.created_at >= month_start
    ).all()
    current_month_omzet = sum(o.total_amount for o in month_orders)

    achievement_percentage = round((current_month_omzet / target_amount * 100), 2) if target_amount > 0 else 0.0

    return jsonify({
        'success': True,
        'data': {
            'total_omzet': total_omzet,
            'total_cost': total_cost,
            'total_profit': total_profit,
            'total_transactions': total_transactions,
            'cash': {
                'count': len(cash_orders),
                'omzet': cash_omzet
            },
            'cashless': {
                'count': len(cashless_orders),
                'omzet': cashless_omzet
            },
            'monthly_target': {
                'month': now.month,
                'year': now.year,
                'target_amount': target_amount,
                'current_month_omzet': current_month_omzet,
                'achievement_percentage': achievement_percentage
            }
        }
    }), 200

@admin_report_bp.route('/admin/reports/profit-daily', methods=['GET'])
@token_required
@roles_required(['admin'])
def get_daily_profit_report(current_user):
    # Agregasi profit harian
    orders = Order.query.join(Payment).filter(
        Payment.payment_status == 'PAID',
        Order.status.in_(['PROCESSING', 'COMPLETED'])
    ).order_by(Order.created_at.asc()).all()

    daily_map = {}
    for o in orders:
        day_str = o.created_at.strftime('%Y-%m-%d')
        if day_str not in daily_map:
            daily_map[day_str] = {
                'date': day_str,
                'omzet': 0,
                'cost': 0,
                'profit': 0,
                'count': 0
            }
        daily_map[day_str]['omzet'] += o.total_amount
        daily_map[day_str]['cost'] += o.total_cost
        daily_map[day_str]['profit'] += (o.total_amount - o.total_cost)
        daily_map[day_str]['count'] += 1

    result = list(daily_map.values())
    return jsonify({
        'success': True,
        'data': result
    }), 200

@admin_report_bp.route('/admin/transactions', methods=['GET'])
@token_required
@roles_required(['admin'])
def get_all_transactions(current_user):
    status_filter = request.args.get('status')
    payment_method = request.args.get('payment_method')

    query = Order.query

    if status_filter:
        query = query.filter(Order.status == status_filter)

    if payment_method:
        query = query.join(Payment).filter(Payment.payment_method == payment_method.upper())

    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [o.to_dict() for o in orders]
    }), 200
