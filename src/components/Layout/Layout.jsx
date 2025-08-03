import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, title, subtitle }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;