import { useState, useEffect } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout/Layout';
import {
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/UI/Modal';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Table from '../components/UI/Table';

const SupplierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    shipped: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800'
  };

  const statusLabels = {
    pending: 'Menunggu',
    confirmed: 'Dikonfirmasi',
    rejected: 'Ditolak',
    shipped: 'Dikirim',
    completed: 'Selesai'
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await api.get(`/orders?${params}`);
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Gagal memuat detail pesanan');
    }
  };

  return (
    <Layout title="Pesanan Saya" subtitle="Lihat status pesanan Anda">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari pesanan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="confirmed">Dikonfirmasi</option>
                <option value="rejected">Ditolak</option>
                <option value="shipped">Dikirim</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Cell header>Kode Pesanan</Table.Cell>
                    <Table.Cell header>Total</Table.Cell>
                    <Table.Cell header>Status</Table.Cell>
                    <Table.Cell header>Tanggal Pesanan</Table.Cell>
                    <Table.Cell header>Aksi</Table.Cell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {orders.map((order) => (
                    <Table.Row key={order.id}>
                      <Table.Cell className="font-medium">{order.order_code}</Table.Cell>
                      <Table.Cell>Rp {order.total_amount?.toLocaleString()}</Table.Cell>
                      <Table.Cell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{new Date(order.order_date).toLocaleDateString('id-ID')}</Table.Cell>
                      <Table.Cell>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          page === currentPage
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

        {/* Order Detail Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Detail Pesanan"
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kode Pesanan</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.order.order_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.order.status]}`}>
                    {statusLabels[selectedOrder.order.status]}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="mt-1 text-sm text-gray-900">Rp {selectedOrder.order.total_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Pesanan</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedOrder.order.order_date).toLocaleDateString('id-ID')}</p>
                </div>
                {selectedOrder.order.confirmed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dikonfirmasi Pada</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedOrder.order.confirmed_at).toLocaleDateString('id-ID')}</p>
                  </div>
                )}
              </div>

              {selectedOrder.order.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catatan</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.order.notes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Pesanan</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.item_name} ({item.item_code})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {item.price?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {item.total_price?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default SupplierOrders; 