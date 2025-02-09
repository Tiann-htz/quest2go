import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  LineChart, 
  Users, 
  MessageSquare, 
  Library,
} from 'lucide-react';

const AdminSidebar = () => {
  const router = useRouter();
  
  const menuItems = [
    {
      path: '/admin/panel',
      name: 'Dashboard',
      icon: LayoutDashboard
    },
    {
        path: '/admin/studies',
        name: 'Studies',
        icon: Library
      },
    {
      path: '/admin/',
      name: 'Analytics & Logs',
      icon: LineChart
    },
    {
      path: '/admin/',
      name: 'Users',
      icon: Users
    },
    {
      path: '/admin/',
      name: 'Chats',
      icon: MessageSquare
    },
  ];

  return (
    <div 
      className="flex flex-col h-full bg-indigo-700"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-center h-16 border-b border-indigo-600">
        <h1 className="text-xl font-bold text-white">Quest2Go Admin</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = router.pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${
                isActive ? 'text-white' : 'text-indigo-200'
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-indigo-600">
        <p className="text-xs text-center text-indigo-200">
          © Quest2Go {new Date().getFullYear()}
          <br />
          All rights reserved
        </p>
      </div>
    </div>
  );
};

export default AdminSidebar;