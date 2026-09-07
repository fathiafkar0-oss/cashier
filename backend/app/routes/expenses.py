from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Expense
from app.auth import token_required

expenses_bp = Blueprint('expenses', __name__)

@expenses_bp.route('/expenses', methods=['GET'])
@token_required
def get_expenses(current_user):
    expenses = Expense.query.filter_by(user_id=current_user.id).order_by(Expense.created_at.desc()).all()
    return jsonify([e.to_dict() for e in expenses]), 200

@expenses_bp.route('/expenses', methods=['POST'])
@token_required
def create_expense(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Tidak ada data input.'}), 400

    category = data.get('category')
    amount = data.get('amount')
    description = data.get('description', '')

    if not category:
        return jsonify({'error': 'Kategori pengeluaran wajib diisi.'}), 400

    try:
        # Konversi ke int jika string angka dikirim
        amount_val = int(amount) if amount is not None else 0
    except (ValueError, TypeError):
        return jsonify({'error': 'Nominal pengeluaran wajib berupa angka.'}), 400

    if amount_val <= 0:
        return jsonify({'error': 'Nominal pengeluaran harus lebih besar dari 0.'}), 400

    try:
        new_expense = Expense(
            user_id=current_user.id,
            category=category,
            amount=amount_val,
            description=description
        )
        db.session.add(new_expense)
        db.session.commit()
        return jsonify(new_expense.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Gagal mencatat pengeluaran: ' + str(e)}), 500
