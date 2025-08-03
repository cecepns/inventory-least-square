import { useState, useEffect } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout/Layout';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/UI/Modal';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Table from '../components/UI/Table';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    role: '',
    name: '',
    phone: '',
    address: ''
  });

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    owner: 'bg-blue-100 text-blue-800',
    supplier: 'bg-green-100 text-green-800'
  };

  const roleLabels = {
    admin: 'Administrator',
    owner: 'Owner',
    supplier: 'Supplier'
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });

      const response = await api.get(`/users?${params}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      setSelectedUser(response.data.user);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Gagal memuat detail user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      username: user.username,
      password: '',
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowCreateModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User berhasil dihapus');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Gagal menghapus user');
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.username || !newUser.password || !newUser.email || !newUser.role || !newUser.name) {
        toast.error('Semua field wajib diisi');
        return;
      }

      if (editingUser) {
        // Update existing user
        const updateData = { ...newUser };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        
        await api.put(`/users/${editingUser.id}`, updateData);
        toast.success('User berhasil diperbarui');
      } else {
        // Create new user
        await api.post('/auth/register', newUser);
        toast.success('User berhasil dibuat');
      }

      setShowCreateModal(false);
      setEditingUser(null);
      setNewUser({
        username: '',
        password: '',
        email: '',
        role: '',
        name: '',
        phone: '',
        address: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating/updating user:', error);
      toast.error(editingUser ? 'Gagal memperbarui user' : 'Gagal membuat user');
    }
  };

  return (
    <Layout title="Kelola User" subtitle="Kelola user dan hak akses sistem">
      <div className="space-y-6">

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Semua Role</option>
              <option value="admin">Administrator</option>
              <option value="owner">Owner</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Tambah User
          </Button>
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
                  <Table.Cell header>Username</Table.Cell>
                  <Table.Cell header>Nama</Table.Cell>
                  <Table.Cell header>Email</Table.Cell>
                  <Table.Cell header>Role</Table.Cell>
                  <Table.Cell header>Telepon</Table.Cell>
                  <Table.Cell header>Tanggal Dibuat</Table.Cell>
                  <Table.Cell header>Aksi</Table.Cell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell className="font-medium">{user.username}</Table.Cell>
                    <Table.Cell>{user.name}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </Table.Cell>
                    <Table.Cell>{user.phone || '-'}</Table.Cell>
                    <Table.Cell>{new Date(user.created_at).toLocaleDateString('id-ID')}</Table.Cell>
                    <Table.Cell>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Lihat Detail"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <TrashIcon className="h-4 w-4" />
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

      {/* User Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Detail User"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${roleColors[selectedUser.role]}`}>
                  {roleLabels[selectedUser.role]}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telepon</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Dibuat</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
            {selectedUser.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Alamat</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.address}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
          setNewUser({
            username: '',
            password: '',
            email: '',
            role: '',
            name: '',
            phone: '',
            address: ''
          });
        }}
        title={editingUser ? 'Edit User' : 'Tambah User Baru'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Masukkan username"
                disabled={!!editingUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={editingUser ? "Kosongkan jika tidak ingin mengubah" : "Masukkan password"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Masukkan email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Pilih Role</option>
                <option value="admin">Administrator</option>
                <option value="owner">Owner</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input
                type="text"
                value={newUser.phone}
                onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Masukkan nomor telepon"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              value={newUser.address}
              onChange={(e) => setNewUser(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Masukkan alamat"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateModal(false);
                setEditingUser(null);
                setNewUser({
                  username: '',
                  password: '',
                  email: '',
                  role: '',
                  name: '',
                  phone: '',
                  address: ''
                });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleCreateUser}>
              {editingUser ? 'Update User' : 'Tambah User'}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </Layout>
  );
};

export default Users; 