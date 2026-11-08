import jwt
import datetime
from flask import request, jsonify, current_app
from functools import wraps
from app.models import User

def generate_token(user_id):
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),  # Masa berlaku 24 jam
            'iat': datetime.datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(
            payload,
            current_app.config.get('JWT_SECRET_KEY'),
            algorithm='HS256'
        )
    except Exception as e:
        return str(e)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Ambil token dari header Authorization: Bearer <token>
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Format header Authorization harus: Bearer <token>'}), 401

        if not token:
            return jsonify({'error': 'Token autentikasi tidak ditemukan'}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config.get('JWT_SECRET_KEY'),
                algorithms=['HS256']
            )
            current_user_id = payload['sub']
            current_user = User.query.get(current_user_id)
            if not current_user:
                return jsonify({'error': 'User tidak ditemukan'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token autentikasi sudah kedaluwarsa'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token autentikasi tidak valid'}), 401

        return f(current_user, *args, **kwargs)

    return decorated
