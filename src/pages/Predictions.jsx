import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import Card from '../components/UI/Card';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import api from '../config/api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const Predictions = () => {
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [periods, setPeriods] = useState(30);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/items', { params: { limit: 1000 } });
      setItems(response.data.items || []);
      if (response.data.items && response.data.items.length > 0) {
        setSelectedItemId(response.data.items[0].id);
        fetchPrediction(response.data.items[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat data barang');
    }
  };

  const fetchPrediction = async (itemId, periodsCount = periods) => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/prediction/${itemId}`, {
        params: { periods: periodsCount }
      });
      setPredictionData(response.data);
    } catch (error) {
      toast.error('Gagal memuat prediksi');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (itemId) => {
    setSelectedItemId(itemId);
    fetchPrediction(itemId);
  };

  const handlePeriodsChange = (newPeriods) => {
    setPeriods(newPeriods);
    if (selectedItemId) {
      fetchPrediction(selectedItemId, newPeriods);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'decreasing':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <MinusIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'increasing':
        return 'Meningkat';
      case 'decreasing':
        return 'Menurun';
      default:
        return 'Stabil';
    }
  };

  const getAccuracyText = (accuracy) => {
    switch (accuracy) {
      case 'very_high':
        return 'Sangat Tinggi';
      case 'high':
        return 'Tinggi';
      case 'medium':
        return 'Sedang';
      case 'low':
        return 'Rendah';
      default:
        return 'Sangat Rendah';
    }
  };

  const getAccuracyColor = (accuracy) => {
    switch (accuracy) {
      case 'very_high':
        return 'text-green-700 bg-green-100';
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <CheckCircleIcon className="h-4 w-4" />;
    }
  };

  return (
    <Layout title="Prediksi Barang" subtitle="Analisis prediksi kebutuhan barang menggunakan algoritma Least Square">
      <div className="space-y-6">
        {/* Controls */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Barang
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                value={selectedItemId}
                onChange={(e) => handleItemChange(e.target.value)}
              >
                <option value="">Pilih Barang</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode Prediksi (Hari)
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                value={periods}
                onChange={(e) => handlePeriodsChange(parseInt(e.target.value))}
              >
                <option value={7}>7 Hari</option>
                <option value={14}>14 Hari</option>
                <option value={30}>30 Hari</option>
                <option value={60}>60 Hari</option>
                <option value={90}>90 Hari</option>
              </select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : predictionData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-primary-100">
                    <ChartBarIcon className="h-6 w-6 text-primary-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Stok Saat Ini</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {predictionData.item?.stock_qty || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-secondary-100">
                    {getTrendIcon(predictionData.prediction?.trend)}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Trend</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {getTrendText(predictionData.prediction?.trend)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Akurasi Prediksi</p>
                    <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getAccuracyColor(predictionData.prediction?.accuracy)}`}>
                      {getAccuracyText(predictionData.prediction?.accuracy)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
                    {getUrgencyIcon(predictionData.recommendation?.urgency)}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rekomendasi</p>
                    <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getUrgencyColor(predictionData.recommendation?.urgency)}`}>
                      {predictionData.recommendation?.action === 'order' ? 'Perlu Order' : 'Monitor'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historical vs Prediction Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Data Historis vs Prediksi
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      ...predictionData.historicalData?.map((item, index) => ({
                        period: index + 1,
                        historical: Math.abs(item.stock_out),
                        type: 'historical'
                      })) || [],
                      ...predictionData.prediction?.predictions?.slice(0, 14).map((item, index) => ({
                        period: (predictionData.historicalData?.length || 0) + index + 1,
                        prediction: item.value,
                        type: 'prediction'
                      })) || []
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="historical" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Data Historis"
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="prediction" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Prediksi"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Prediction Details */}
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Detail Prediksi
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Informasi Barang</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Kode:</strong> {predictionData.item?.code}</p>
                      <p><strong>Nama:</strong> {predictionData.item?.name}</p>
                      <p><strong>Model:</strong> {predictionData.item?.model}</p>
                      <p><strong>Warna:</strong> {predictionData.item?.color}</p>
                      <p><strong>Min Stok:</strong> {predictionData.item?.min_stock}</p>
                      <p><strong>Max Stok:</strong> {predictionData.item?.max_stock}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Statistik Prediksi</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Slope:</strong> {predictionData.prediction?.slope}</p>
                      <p><strong>Intercept:</strong> {predictionData.prediction?.intercept}</p>
                      <p><strong>Korelasi:</strong> {predictionData.prediction?.correlation}</p>
                    </div>
                  </div>

                  {predictionData.recommendation?.action === 'order' && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        Rekomendasi Pengadaan
                      </h4>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <p><strong>Jumlah:</strong> {predictionData.recommendation?.quantity} unit</p>
                        <p><strong>Alasan:</strong> {predictionData.recommendation?.reason}</p>
                        <p><strong>Prioritas:</strong> {predictionData.recommendation?.urgency === 'high' ? 'Tinggi' : 'Sedang'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Prediction Table */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tabel Prediksi {periods} Hari Ke Depan
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.Cell header>Periode</Table.Cell>
                      <Table.Cell header>Tanggal</Table.Cell>
                      <Table.Cell header>Prediksi Demand</Table.Cell>
                      <Table.Cell header>Status</Table.Cell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {predictionData.prediction?.predictions?.slice(0, 15).map((pred, index) => (
                      <Table.Row key={index}>
                        <Table.Cell>{pred.period}</Table.Cell>
                        <Table.Cell>
                          {new Date(pred.date).toLocaleDateString('id-ID')}
                        </Table.Cell>
                        <Table.Cell className="font-medium">
                          {pred.value} unit
                        </Table.Cell>
                        <Table.Cell>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {pred.type === 'prediction' ? 'Prediksi' : 'Data'}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </Card>
          </>
        ) : selectedItemId ? (
          <Card className="p-12 text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Data Tidak Tersedia
            </h3>
            <p className="text-gray-500">
              Tidak ada data historis yang cukup untuk membuat prediksi barang ini.
            </p>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Pilih Barang
            </h3>
            <p className="text-gray-500">
              Pilih barang untuk melihat prediksi kebutuhan.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Predictions;