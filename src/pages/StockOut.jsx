import { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';

const StockOut = () => {
  const { isAdmin } = useAuth();
  const [stockOut, setStockOut] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    totalItems: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    transaction_code: '',
    item_id: '',
    qty: 1,
    purpose: '',
    recipient: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchStockOut();
    fetchItems();
  }, [filters]);

  const fetchStockOut = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock-out', { params: filters });
      setStockOut(response.data.stockOut || []);
      setPagination(response.data.pagination || { current: 1, total: 1, totalItems: 0 });
    } catch (error) {
      toast.error('Gagal memuat data stok keluar');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/items', { params: { limit: 1000 } });
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const generateTransactionCode = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    return `OUT${year}${month}${day}${time}`;
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const openModal = (record = null) => {
    if (record) {
      setSelectedRecord(record);
      setFormData({
        transaction_code: record.transaction_code,
        item_id: record.item_id,
        qty: record.qty,
        purpose: record.purpose,
        recipient: record.recipient || '',
        date: record.date.split('T')[0],
        notes: record.notes || ''
      });
    } else {
      setSelectedRecord(null);
      setFormData({
        transaction_code: generateTransactionCode(),
        item_id: '',
        qty: 1,
        purpose: '',
        recipient: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/stock-out/${selectedRecord.id}`, formData);
        toast.success('Data stok keluar berhasil diperbarui');
      } else {
        await api.post('/stock-out', formData);
        toast.success('Data stok keluar berhasil ditambahkan');
      }
      setShowModal(false);
      fetchStockOut();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (record) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${record.transaction_code}"?`)) {
      try {
        await api.delete(`/stock-out/${record.id}`);
        toast.success('Data stok keluar berhasil dihapus');
        fetchStockOut();
      } catch (error) {
        toast.error('Gagal menghapus data stok keluar');
      }
    }
  };

  const getSelectedItem = () => {
    return items.find(item => item.id == formData.item_id);
  };

  const selectedItem = getSelectedItem();

  return (
    <Layout title="Barang Keluar" subtitle="Kelola data barang keluar">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={filters.search}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {isAdmin && (
              <Button onClick={() => openModal()}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Stok Keluar
              </Button>
            )}
          </div>
        </Card>

        {/* Stock Out Table */}
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
                    <Table.Cell header>Kode Transaksi</Table.Cell>
                    <Table.Cell header>Tanggal</Table.Cell>
                    <Table.Cell header>Barang</Table.Cell>
                    <Table.Cell header>Qty</Table.Cell>
                    <Table.Cell header>Tujuan</Table.Cell>
                    <Table.Cell header>Penerima</Table.Cell>
                    <Table.Cell header>Catatan</Table.Cell>
                    {isAdmin && <Table.Cell header>Aksi</Table.Cell>}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {stockOut.map((record) => (
                    <Table.Row key={record.id}>
                      <Table.Cell className="font-medium">{record.transaction_code}</Table.Cell>
                      <Table.Cell>
                        {new Date(record.date).toLocaleDateString('id-ID')}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="text-sm">
                          <div className="font-medium">{record.item_name}</div>
                          <div className="text-gray-500">{record.item_code}</div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{record.qty}</Table.Cell>
                      <Table.Cell>{record.purpose}</Table.Cell>
                      <Table.Cell>{record.recipient || '-'}</Table.Cell>
                      <Table.Cell>{record.notes || '-'}</Table.Cell>
                      {isAdmin && (
                        <Table.Cell>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(record)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>

              {/* Pagination */}
              {pagination.total > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Menampilkan {((pagination.current - 1) * filters.limit) + 1} - {Math.min(pagination.current * filters.limit, pagination.totalItems)} dari {pagination.totalItems} transaksi
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

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedRecord ? 'Edit Stok Keluar' : 'Tambah Stok Keluar'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Transaksi *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                  value={formData.transaction_code}
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barang *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.item_id}
                  onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                >
                  <option value="">Pilih Barang</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name} (Stok: {item.stock_qty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedItem ? selectedItem.stock_qty : undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) })}
                />
                {selectedItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Stok tersedia: {selectedItem.stock_qty} {selectedItem.unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tujuan *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                >
                  <option value="">Pilih Tujuan</option>
                  <option value="Penjualan">Penjualan</option>
                  <option value="Produksi">Produksi</option>
                  <option value="Rusak">Barang Rusak</option>
                  <option value="Retur">Retur</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penerima
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan
              </label>
              <textarea
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Batal
              </Button>
              <Button type="submit">
                {selectedRecord ? 'Perbarui' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default StockOut;