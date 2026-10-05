from flask import Blueprint, request, jsonify
from app.database import db
from app.models import User, Role
from app.auth import generate_token, token_required

auth_bp = Blueprint('customer_auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', 'pelanggan123')

    if not full_name:
        return jsonify({'success': False, 'message': 'Nama lengkap wajib diisi'}), 400

    # Auto generate username & email jika login cepat nomor telepon
    username = phone or email or f"cust_{full_name.lower().replace(' ', '_')}"
    if not email:
        email = f"{username}@pelanggan.resto"

    role = Role.query.filter_by(name='customer').first()
    if not role:
        role = Role(name='customer', description='Pelanggan Restoran')
        db.session.add(role)
        db.session.flush()

    existing = User.query.filter((User.username == username) | (User.email == email)).first()
    if existing:
        token = generate_token(existing.id, role='customer')
        return jsonify({
            'success': True,
            'message': 'Login berhasil',
            'data': {
                'token': token,
                'user': existing.to_dict()
            }
        }), 200

    new_user = User(
        role_id=role.id,
        username=username,
        email=email,
        phone=phone,
        full_name=full_name,
        is_active=True
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    token = generate_token(new_user.id, role='customer')
    return jsonify({
        'success': True,
        'message': 'Registrasi berhasil',
        'data': {
            'token': token,
            'user': new_user.to_dict()
        }
    }), 201

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('username') or data.get('phone') or data.get('email')
    password = data.get('password', '')

    if not identifier:
        return jsonify({'success': False, 'message': 'Username, Email, atau No. Telepon wajib diisi'}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier) | (User.phone == identifier)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Kredensial login tidak valid'}), 401

    if not user.is_active:
        return jsonify({'success': False, 'message': 'Akun Anda dinonaktifkan'}), 403

    token = generate_token(user.id, role=user.role.name if user.role else 'customer')
    return jsonify({
        'success': True,
        'message': 'Login berhasil',
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
