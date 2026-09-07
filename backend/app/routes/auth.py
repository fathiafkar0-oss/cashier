from datetime import datetime
from flask import Blueprint, request, jsonify
from app.database import db
from app.models import User
from app.auth import generate_token, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Data registrasi tidak boleh kosong.'}), 400

    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    store_name = (data.get('store_name') or '').strip()
    password = data.get('password') or ''

    if not username or not email or not password:
        return jsonify({'error': 'Username, Email, dan Password wajib diisi.'}), 400

    if len(username) < 3:
        return jsonify({'error': 'Username minimal 3 karakter.'}), 400

    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Format alamat email tidak valid.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password minimal 6 karakter.'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': f'Username "{username}" sudah digunakan.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': f'Email "{email}" sudah terdaftar.'}), 400

    try:
        user = User(username=username, email=email, store_name=store_name or 'Toko Ritel')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        token = generate_token(user.id)
        return jsonify({
            'message': 'Pendaftaran akun berhasil!',
            'token': token,
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal mendaftarkan akun: {str(e)}'}), 500

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = (data.get('identifier') or data.get('email') or data.get('username') or '').strip()
    password = data.get('password') if data else None

    if not identifier or not password:
        return jsonify({'error': 'Email/Username dan password wajib diisi.'}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user:
        return jsonify({'error': 'Akun tidak ditemukan. Silakan periksa kembali atau daftar akun baru.'}), 401

    # Cek apakah akun sedang terkunci karena 5 kali percobaan gagal
    if user.is_locked():
        remaining_secs = int((user.locked_until - datetime.utcnow()).total_seconds())
        remaining_mins = max(1, (remaining_secs + 59) // 60)
        return jsonify({
            'error': f'Akun terkunci sementara karena 5 kali percobaan gagal. Silakan coba lagi dalam {remaining_mins} menit.'
        }), 429

    # Validasi password
    if not user.check_password(password):
        user.record_failed_login()
        db.session.commit()
        remaining_attempts = max(0, 5 - (user.failed_login_attempts or 0))
        if remaining_attempts == 0:
            return jsonify({
                'error': 'Akun Anda dikunci sementara selama 15 menit karena telah mencapai batas 5 kali percobaan gagal.'
            }), 429
        return jsonify({
            'error': f'Password salah. Sisa kesempatan: {remaining_attempts} dari 5 kali percobaan.'
        }), 401

    # Reset counter kegagalan setelah login berhasil
    user.reset_failed_login()
    db.session.commit()

    token = generate_token(user.id)
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/auth/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify(current_user.to_dict()), 200

@auth_bp.route('/auth/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Tidak ada data untuk diperbarui.'}), 400

    store_name = (data.get('store_name') or '').strip()
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()

    if username and username != current_user.username:
        if len(username) < 3:
            return jsonify({'error': 'Username minimal 3 karakter.'}), 400
        if User.query.filter(User.username == username, User.id != current_user.id).first():
            return jsonify({'error': f'Username "{username}" sudah digunakan akun lain.'}), 400
        current_user.username = username

    if email and email != current_user.email:
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Format alamat email tidak valid.'}), 400
        if User.query.filter(User.email == email, User.id != current_user.id).first():
            return jsonify({'error': f'Email "{email}" sudah digunakan akun lain.'}), 400
        current_user.email = email

    if store_name:
        current_user.store_name = store_name

    db.session.commit()
    return jsonify({
        'message': 'Profil berhasil diperbarui.',
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/auth/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Data sandi tidak boleh kosong.'}), 400

    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''

    if not current_password or not new_password:
        return jsonify({'error': 'Kata sandi saat ini dan kata sandi baru wajib diisi.'}), 400

    if not current_user.check_password(current_password):
        return jsonify({'error': 'Kata sandi saat ini salah.'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Kata sandi baru minimal 6 karakter.'}), 400

    current_user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Kata sandi berhasil diperbarui.'}), 200

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logout sukses.'}), 200
