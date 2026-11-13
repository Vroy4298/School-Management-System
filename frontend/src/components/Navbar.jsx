import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'GUARDIAN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-3">
        <h2 className="text-lg font-bold text-gray-800">{title || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 pr-4 border-r border-gray-200">
          <UserCircle className="h-8 w-8 text-gray-400" />
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors text-xs font-semibold"
          title="Sign out of account"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
