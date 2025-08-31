import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Card from '../components/UI/Card';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import toast from 'react-hot-toast';
import {
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { isAdmin, isOwner, isSupplier } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentMovements: [],
    lowStockItems: [],
    trends: [],
    prediction: { predictions: [] }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-semibold text-gray-900">{value || 0}</p>
            {trend && (
              <div className="ml-2 flex items-center">
                {trend > 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Selamat datang di sistem inventori">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" subtitle="Selamat datang di sistem inventori">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Barang"
            value={dashboardData.stats.total_items}
            icon={CubeIcon}
            color="bg-primary-500"
          />
          <StatCard
            title="Total Stok"
            value={dashboardData.stats.total_stock}
            icon={ChartBarIcon}
            color="bg-secondary-500"
          />
          <StatCard
            title="Pesanan Pending"
            value={dashboardData.stats.pending_orders}
            icon={ShoppingCartIcon}
            color="bg-yellow-500"
          />
          <StatCard
            title="Stok Menipis"
            value={dashboardData.stats.low_stock_items}
            icon={ExclamationTriangleIcon}
            color="bg-red-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prediction Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Prediksi Trend Stok
              </h3>
              <Link 
                to="/predictions"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Lihat Detail
              </Link>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.prediction.predictions.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Prediksi Demand"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Movements */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Pergerakan Stok Terbaru
              </h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dashboardData.recentMovements.slice(0, 5).map((movement, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{movement.item_name}</p>
                    <p className="text-xs text-gray-500">{movement.transaction_code}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      movement.type === 'in' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movement.type === 'in' ? '+' : '-'}{movement.qty}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(movement.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {dashboardData.lowStockItems.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                Peringatan Stok Menipis
              </h3>
              <Link 
                to="/items"
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Lihat Semua
              </Link>
            </div>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Cell header>Kode</Table.Cell>
                  <Table.Cell header>Nama Barang</Table.Cell>
                  <Table.Cell header>Model</Table.Cell>
                  <Table.Cell header>Warna</Table.Cell>
                  <Table.Cell header>Stok Saat Ini</Table.Cell>
                  <Table.Cell header>Min Stok</Table.Cell>
                  <Table.Cell header>Status</Table.Cell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {dashboardData.lowStockItems.slice(0, 5).map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>{item.code}</Table.Cell>
                    <Table.Cell>{item.name}</Table.Cell>
                    <Table.Cell>{item.model}</Table.Cell>
                    <Table.Cell>{item.color}</Table.Cell>
                    <Table.Cell>{item.stock_qty}</Table.Cell>
                    <Table.Cell>{item.min_stock}</Table.Cell>
                    <Table.Cell>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Stok Menipis
                      </span>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;