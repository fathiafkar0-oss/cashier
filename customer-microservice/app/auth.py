import jwt
from datetime import datetime, timedelta
from flask import request, jsonify, current_app
from functools import wraps
from app.database import db
from app.models import User

def generate_token(user_id, role='customer'):
    payload = {
        'exp': datetime.utcnow() + timedelta(days=2),
        'iat': datetime.utcnow(),
        'sub': str(user_id),
        'role': role
    }
    return jwt.encode(
        payload,
        current_app.config.get('JWT_SECRET_KEY', 'default_jwt_secret_dev_32_bytes_len'),
        algorithm='HS256'
    )

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'success': False, 'message': 'Format header Authorization harus: Bearer <token>'}), 401

        if not token:
            return jsonify({'success': False, 'message': 'Token autentikasi tidak ditemukan'}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config.get('JWT_SECRET_KEY', 'default_jwt_secret_dev'),
                algorithms=['HS256']
            )
            user_id = int(payload['sub'])
            current_user = db.session.get(User, user_id)
            if not current_user or not current_user.is_active:
                return jsonify({'success': False, 'message': 'User tidak aktif atau tidak ditemukan'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token autentikasi sudah kedaluwarsa'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Token autentikasi tidak valid'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def optional_token(f):
    """Izinkan akses guest atau attach user jika token ada"""
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None
        if 'Authorization' in request.headers:
            try:
                auth_header = request.headers['Authorization']
                token = auth_header.split(" ")[1]
                payload = jwt.decode(
                    token,
                    current_app.config.get('JWT_SECRET_KEY', 'default_jwt_secret_dev'),
                    algorithms=['HS256']
                )
                user_id = int(payload['sub'])
                current_user = db.session.get(User, user_id)
            except Exception:
                current_user = None
        return f(current_user, *args, **kwargs)
    return decorated
