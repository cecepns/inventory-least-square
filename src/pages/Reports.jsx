import { useState, useEffect } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout/Layout';
import {
  DocumentTextIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const Reports = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(reportType && { type: reportType }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await api.get(`/reports?${params}`);
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    fetchReports();
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-100';
      case 'high': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStockStatusLabel = (status) => {
    switch (status) {
      case 'low': return 'Stok Rendah';
      case 'high': return 'Stok Tinggi';
      default: return 'Stok Normal';
    }
  };

  const getMovementTypeColor = (type) => {
    return type === 'IN' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOrderStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'confirmed': return 'Dikonfirmasi';
      case 'rejected': return 'Ditolak';
      case 'shipped': return 'Dikirim';
      case 'completed': return 'Selesai';
      default: return status;
    }
  };

  return (
    <Layout title="Laporan" subtitle="Generate dan lihat laporan sistem inventori">
      <div className="space-y-6">

      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Laporan</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Semua Laporan</option>
                <option value="stock">Laporan Stok</option>
                <option value="movement">Laporan Pergerakan</option>
                <option value="orders">Laporan Pesanan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateReport} loading={loading}>
                <FunnelIcon className="h-4 w-4 mr-2" />
                Generate Laporan
              </Button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {!loading && Object.keys(reports).length > 0 && (
          <div className="space-y-8">
            {/* Stock Report */}
            {reports.stock && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Laporan Stok
                  </h3>
                  <Button
                    onClick={() => exportToCSV(reports.stock, 'laporan_stok')}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stok</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.stock.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.model}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock_qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.min_stock}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(item.stock_status)}`}>
                              {getStockStatusLabel(item.stock_status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Movement Report */}
            {reports.movement && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    Laporan Pergerakan Stok
                  </h3>
                  <Button
                    onClick={() => exportToCSV(reports.movement, 'laporan_pergerakan')}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Transaksi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier/Penerima</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.movement.map((movement, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement.type)}`}>
                              {movement.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.transaction_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.item_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {movement.price?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {movement.total_price?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(movement.date).toLocaleDateString('id-ID')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.supplier_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Orders Report */}
            {reports.orders && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Laporan Pesanan
                  </h3>
                  <Button
                    onClick={() => exportToCSV(reports.orders, 'laporan_pesanan')}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Pesanan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pesanan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dikonfirmasi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dikirim</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.orders.map((order, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.order_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.supplier_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {order.total_amount?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total_items}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.order_date).toLocaleDateString('id-ID')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.confirmed_at ? new Date(order.confirmed_at).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.shipped_at ? new Date(order.shipped_at).toLocaleDateString('id-ID') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && Object.keys(reports).length === 0 && (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada laporan</h3>
            <p className="mt-1 text-sm text-gray-500">Generate laporan untuk melihat data</p>
          </div>
        )}
      </Card>
      </div>
    </Layout>
  );
};

export default Reports; 