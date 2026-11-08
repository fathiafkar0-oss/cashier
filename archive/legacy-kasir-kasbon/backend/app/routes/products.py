from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Product
from app.auth import token_required

products_bp = Blueprint('products', __name__)

@products_bp.route('/products', methods=['GET'])
@token_required
def get_products(current_user):
    products = Product.query.filter_by(user_id=current_user.id).order_by(Product.name).all()
    return jsonify([p.to_dict() for p in products]), 200

@products_bp.route('/products', methods=['POST'])
@token_required
def create_product(current_user):
    data = request.get_json()
    if not data or not data.get('name') or data.get('price') is None or data.get('cost_price') is None:
        return jsonify({'error': 'Kolom nama, harga jual, dan harga modal wajib diisi.'}), 400

    sku = data.get('sku')
    if sku:
        existing_product = Product.query.filter_by(sku=sku, user_id=current_user.id).first()
        if existing_product:
            return jsonify({'error': f'Produk dengan SKU {sku} sudah terdaftar di toko Anda.'}), 400

    product = Product(
        user_id=current_user.id,
        sku=sku if sku else None,
        name=data.get('name'),
        price=int(data.get('price')),
        cost_price=int(data.get('cost_price')),
        stock=int(data.get('stock', 0)),
        min_stock=int(data.get('min_stock', 5)),
        category=data.get('category', 'Lainnya'),
        is_retail=bool(data.get('is_retail', False)),
        retail_group=data.get('retail_group'),
        half_pack_price=int(data.get('half_pack_price')) if (data.get('half_pack_price') is not None and str(data.get('half_pack_price')).strip() != '') else None,
        pack_size=int(data.get('pack_size', 16)) if (data.get('pack_size') is not None and str(data.get('pack_size')).strip() != '') else 16
    )

    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201

@products_bp.route('/products/<int:product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    product = Product.query.filter_by(id=product_id, user_id=current_user.id).first()
    if not product:
        return jsonify({'error': 'Produk tidak ditemukan.'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Tidak ada data untuk diperbarui.'}), 400

    sku = data.get('sku')
    if sku and sku != product.sku:
        existing_product = Product.query.filter_by(sku=sku, user_id=current_user.id).first()
        if existing_product:
            return jsonify({'error': f'Produk dengan SKU {sku} sudah terdaftar di toko Anda.'}), 400

    if data.get('name'):
        product.name = data.get('name')
    if data.get('price') is not None:
        product.price = int(data.get('price'))
    if data.get('cost_price') is not None:
        product.cost_price = int(data.get('cost_price'))
    if data.get('stock') is not None:
        product.stock = int(data.get('stock'))
    if data.get('min_stock') is not None:
        product.min_stock = int(data.get('min_stock'))
    if 'sku' in data:
        product.sku = data.get('sku') if data.get('sku') else None
    if data.get('category'):
        product.category = data.get('category')
    if 'is_retail' in data:
        product.is_retail = bool(data.get('is_retail'))
    if 'retail_group' in data:
        product.retail_group = data.get('retail_group')
    if 'half_pack_price' in data:
        half_price = data.get('half_pack_price')
        product.half_pack_price = int(half_price) if (half_price is not None and str(half_price).strip() != '') else None
    if 'pack_size' in data:
        p_size = data.get('pack_size')
        product.pack_size = int(p_size) if (p_size is not None and str(p_size).strip() != '') else 16

    db.session.commit()
    return jsonify(product.to_dict()), 200

@products_bp.route('/products/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    product = Product.query.filter_by(id=product_id, user_id=current_user.id).first()
    if not product:
        return jsonify({'error': 'Produk tidak ditemukan.'}), 404
    
    # Cek relasi transaksi untuk mencegah database foreign key constraint error
    from app.models import TransactionDetail
    has_relations = TransactionDetail.query.filter_by(product_id=product_id).first() is not None
    if has_relations:
        return jsonify({'error': 'Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan.'}), 400

    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Produk berhasil dihapus.'}), 200
