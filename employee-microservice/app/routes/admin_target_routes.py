from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app.database import db
from app.models import Target, Order, Payment
from app.auth import token_required, roles_required

admin_target_bp = Blueprint('employee_admin_target', __name__)

@admin_target_bp.route('/admin/targets', methods=['GET'])
@token_required
@roles_required(['admin'])
def get_targets(current_user):
    targets = Target.query.order_by(Target.year.desc(), Target.month.desc()).all()
    results = []

    for t in targets:
        # Hitung omzet aktual pada bulan & tahun tersebut
        start_date = datetime(t.year, t.month, 1)
        if t.month == 12:
            end_date = datetime(t.year + 1, 1, 1)
        else:
            end_date = datetime(t.year, t.month + 1, 1)

        actual_omzet = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).join(Payment).filter(
            Payment.payment_status == 'PAID',
            Order.status.in_(['PROCESSING', 'COMPLETED']),
            Order.created_at >= start_date,
            Order.created_at < end_date
        ).scalar() or 0

        achievement_pct = round((actual_omzet / t.target_amount * 100), 2) if t.target_amount > 0 else 0.0

        item = t.to_dict()
        item['actual_omzet'] = actual_omzet
        item['achievement_percentage'] = achievement_pct
        results.append(item)

    return jsonify({
        'success': True,
        'data': results
    }), 200

@admin_target_bp.route('/admin/targets', methods=['POST'])
@token_required
@roles_required(['admin'])
def set_target(current_user):
    data = request.get_json() or {}
    month = data.get('month')
    year = data.get('year')
    target_amount = data.get('target_amount')

    if not month or not year or not target_amount:
        return jsonify({'success': False, 'message': 'Bulan, tahun, dan target_amount wajib diisi'}), 400

    try:
        month = int(month)
        year = int(year)
        target_amount = int(target_amount)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Format angka tidak valid'}), 400

    if not (1 <= month <= 12) or year < 2020 or target_amount <= 0:
        return jsonify({'success': False, 'message': 'Nilai bulan (1-12), tahun (>=2020), dan target (>0) tidak valid'}), 400

    target = Target.query.filter_by(month=month, year=year).first()
    if target:
        target.target_amount = target_amount
        target.updated_at = datetime.utcnow()
    else:
        target = Target(
            month=month,
            year=year,
            target_amount=target_amount,
            created_by=current_user.id
        )
        db.session.add(target)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Target omzet periode {month}/{year} berhasil disimpan',
        'data': target.to_dict()
    }), 200
