import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Card from '../components/UI/Card';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const Items = () => {
  const { isAdmin, isOwner } = useAuth();
  const canEdit = isAdmin; // Only admin can edit, owner is read-only
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    totalItems: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    page: 1,
    limit: 10
  });
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    model: '',
    color: '',
    size: '',
    category_id: '',
    min_stock: 10,
    max_stock: 1000,
    unit: 'pcs',
    price: 0,
    description: ''
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [filters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/items', { params: filters });
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Gagal memuat data barang');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleCategoryFilter = (e) => {
    setFilters({ ...filters, category: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const openItemModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        model: item.model || '',
        color: item.color || '',
        size: item.size || '',
        category_id: item.category_id || '',
        min_stock: item.min_stock,
        max_stock: item.max_stock,
        unit: item.unit,
        price: item.price,
        description: item.description || ''
      });
    } else {
      setSelectedItem(null);
      setFormData({
        code: '',
        name: '',
        model: '',
        color: '',
        size: '',
        category_id: '',
        min_stock: 10,
        max_stock: 1000,
        unit: 'pcs',
        price: 0,
        description: ''
      });
    }
    setShowItemModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await api.put(`/items/${selectedItem.id}`, formData);
        toast.success('Barang berhasil diperbarui');
      } else {
        await api.post('/items', formData);
        toast.success('Barang berhasil ditambahkan');
      }
      setShowItemModal(false);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus barang "${item.name}"?`)) {
      try {
        await api.delete(`/items/${item.id}`);
        toast.success('Barang berhasil dihapus');
        fetchItems();
      } catch (error) {
        toast.error('Gagal menghapus barang');
      }
    }
  };

  const getStockStatus = (item) => {
    if (item.stock_qty <= item.min_stock) {
      return { text: 'Stok Menipis', color: 'bg-red-100 text-red-800' };
    } else if (item.stock_qty >= item.max_stock) {
      return { text: 'Stok Penuh', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: 'Normal', color: 'bg-green-100 text-green-800' };
    }
  };

  return (
    <Layout title="Data Barang" subtitle="Kelola data barang inventori">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari barang..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={filters.search}
                  onChange={handleSearch}
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                value={filters.category}
                onChange={handleCategoryFilter}
              >
                <option value="">Semua Kategori</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {canEdit && (
              <Button onClick={() => openItemModal()}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Barang
              </Button>
            )}
          </div>
        </Card>

        {/* Items Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Cell header>Kode</Table.Cell>
                    <Table.Cell header>Nama</Table.Cell>
                    {/* <Table.Cell header>Model</Table.Cell> */}
                    <Table.Cell header>Warna</Table.Cell>
                    <Table.Cell header>Size</Table.Cell>
                    <Table.Cell header>Stok</Table.Cell>
                    <Table.Cell header>Status</Table.Cell>
                    <Table.Cell header>Harga</Table.Cell>
                    {canEdit && <Table.Cell header>Aksi</Table.Cell>}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {items.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <Table.Row key={item.id}>
                        <Table.Cell className="font-medium">{item.code}</Table.Cell>
                        <Table.Cell>{item.name}</Table.Cell>
                        <Table.Cell>{item.model}</Table.Cell>
                        <Table.Cell>{item.color}</Table.Cell>
                        <Table.Cell>{item.size}</Table.Cell>
                        <Table.Cell>
                          <div className="text-sm">
                            <div className="font-medium">{item.stock_qty} {item.unit}</div>
                            <div className="text-gray-500">Min: {item.min_stock}</div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          Rp {item.price?.toLocaleString('id-ID')}
                        </Table.Cell>
                        {canEdit && (
                          <Table.Cell>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openItemModal(item)}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </Table.Cell>
                        )}
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>

              {/* Pagination */}
              {pagination.total > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Menampilkan {((pagination.current - 1) * filters.limit) + 1} - {Math.min(pagination.current * filters.limit, pagination.totalItems)} dari {pagination.totalItems} barang
                  </div>
                  <div className="flex space-x-2">
                    {Array.from({ length: pagination.total }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          page === pagination.current
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Item Modal */}
        <Modal
          isOpen={showItemModal}
          onClose={() => setShowItemModal(false)}
          title={selectedItem ? 'Edit Barang' : 'Tambah Barang'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Barang *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warna
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                >
                  <option value="">Pilih Warna</option>
                  <option value="Blue">Blue</option>
                  <option value="Cokpol">Cokpol</option>
                  <option value="Coksu">Coksu</option>
                  <option value="Dark Green">Dark Green</option>
                  <option value="Denim">Denim</option>
                  <option value="Fuchia">Fuchia</option>
                  <option value="Hitam">Hitam</option>
                  <option value="Late">Late</option>
                  <option value="Lemon">Lemon</option>
                  <option value="Lilac">Lilac</option>
                  <option value="Magenta">Magenta</option>
                  <option value="Maroon">Maroon</option>
                  <option value="Merah">Merah</option>
                  <option value="Milk">Milk</option>
                  <option value="Milo">Milo</option>
                  <option value="Mint">Mint</option>
                  <option value="Mouve">Mouve</option>
                  <option value="Peach">Peach</option>
                  <option value="Putih">Putih</option>
                  <option value="Teal">Teal</option>
                  <option value="Terasi">Terasi</option>
                  <option value="Sample">Sample</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Stok
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Stok
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.max_stock}
                  onChange={(e) => setFormData({ ...formData, max_stock: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="pcs">Pcs</option>
                  <option value="kg">Kg</option>
                  <option value="meter">Meter</option>
                  <option value="liter">Liter</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="lembar">Lembar</option>
                  <option value="cones">Cones</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowItemModal(false)}
              >
                Batal
              </Button>
              <Button type="submit">
                {selectedItem ? 'Perbarui' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Items;