import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout/Layout';
import {
  PlusIcon,
  TrashIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [order, setOrder] = useState({
    items: [],
    notes: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/items');
      setItems(response.data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Gagal memuat data barang');
    }
  };

  const addItemToOrder = () => {
    setOrder(prev => ({
      ...prev,
      items: [...prev.items, { item_id: '', qty: 1, price: 0, notes: '' }]
    }));
  };

  const updateOrderItem = (index, field, value) => {
    setOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeOrderItem = (index) => {
    setOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (order.items.length === 0) {
      toast.error('Minimal satu item harus ditambahkan');
      return;
    }

    // Validate all items have required fields
    const invalidItems = order.items.filter(item => !item.item_id || item.qty <= 0);
    if (invalidItems.length > 0) {
      toast.error('Semua item harus memiliki barang dan quantity yang valid');
      return;
    }

    try {
      setLoading(true);
      await api.post('/orders', order);
      toast.success('Pesanan berhasil dibuat!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return order.items.reduce((total, item) => {
      return total + (item.qty * item.price);
    }, 0);
  };

  return (
    <Layout title="Buat Pesanan" subtitle="Form pesanan untuk supplier">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <div className="flex items-center mb-6">
            <ShoppingCartIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Form Pesanan Baru</h2>
              <p className="text-sm text-gray-600">Isi form di bawah untuk membuat pesanan baru</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Item Pesanan</h3>
                <Button 
                  type="button" 
                  onClick={addItemToOrder} 
                  variant="outline" 
                  size="sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Tambah Item
                </Button>
              </div>

              {order.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCartIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada item yang ditambahkan</p>
                  <p className="text-sm">Klik "Tambah Item" untuk memulai</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pilih Barang *
                          </label>
                          <select
                            required
                            value={item.item_id}
                            onChange={(e) => updateOrderItem(index, 'item_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Pilih Barang</option>
                            {items.map(itemOption => (
                              <option key={itemOption.id} value={itemOption.id}>
                                {itemOption.name} ({itemOption.code}) - Stok: {itemOption.stock_qty}
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
                            value={item.qty}
                            onChange={(e) => updateOrderItem(index, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Harga per Unit *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Total: Rp {(item.qty * item.price).toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan (Opsional)
              </label>
              <textarea
                value={order.notes}
                onChange={(e) => setOrder(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tambahkan catatan untuk pesanan ini..."
              />
            </div>

            {/* Total Section */}
            {order.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Pesanan:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    Rp {calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={loading || order.items.length === 0}
              >
                {loading ? 'Menyimpan...' : 'Buat Pesanan'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateOrder; 