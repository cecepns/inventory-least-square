import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  CubeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UsersIcon,
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import logo from '../../assets/twc.png';

const Sidebar = () => {
  const { user, isAdmin, isOwner, isSupplier } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Data Barang', href: '/items', icon: CubeIcon },
    { name: 'Barang Masuk', href: '/stock-in', icon: ArrowRightIcon },
    { name: 'Barang Keluar', href: '/stock-out', icon: ArrowLeftIcon },
    { name: 'Pesanan', href: '/orders', icon: ShoppingCartIcon },
    { name: 'Laporan', href: '/reports', icon: DocumentTextIcon },
    { name: 'Prediksi Barang', href: '/predictions', icon: ChartBarIcon },
    { name: 'Kelola User', href: '/users', icon: UsersIcon },
  ];

  const ownerMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Data Barang', href: '/items', icon: CubeIcon },
    { name: 'Laporan', href: '/reports', icon: DocumentTextIcon },
    { name: 'Prediksi Barang', href: '/predictions', icon: ChartBarIcon },
  ];

  const supplierMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Form Pesanan', href: '/create-order', icon: ShoppingCartIcon },
  ];

  let menuItems = [];
  if (isAdmin) menuItems = adminMenuItems;
  else if (isOwner) menuItems = ownerMenuItems;
  else if (isSupplier) menuItems = supplierMenuItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 flex justify-center w-full">
          <img src={logo} alt="Inventory System" className="h-auto w-24" />
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg text-gray-400 hover:text-gray-500"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <SidebarContent />
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;