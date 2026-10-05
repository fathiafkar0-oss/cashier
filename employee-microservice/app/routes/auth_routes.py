from flask import Blueprint, request, jsonify
from app.database import db
from app.models import User
from app.auth import generate_token, token_required

auth_bp = Blueprint('employee_auth', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username dan password wajib diisi'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Kredensial login tidak valid'}), 401

    if not user.is_active:
        return jsonify({'success': False, 'message': 'Akun Anda dinonaktifkan'}), 403

    user_role = user.role.name if user.role else 'unknown'
    if user_role not in ['admin', 'cashier']:
        return jsonify({'success': False, 'message': 'Akses khusus Karyawan (Admin / Kasir)'}), 403

    token = generate_token(user.id, role=user_role)
    return jsonify({
        'success': True,
        'message': f'Login berhasil sebagai {user_role.upper()}',
        'data': {
            'token': token,
            'user': user.to_dict()
        }
    }), 200

@auth_bp.route('/auth/me', methods=['GET'])
@token_required
def me(current_user):
    return jsonify({
        'success': True,
        'data': current_user.to_dict()
    }), 200
