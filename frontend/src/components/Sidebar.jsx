import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  School,
  BookOpen,
  CalendarCheck,
  Award,
  DollarSign,
  ShieldCheck,
  BookMarked,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const getLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { to: '/admin', label: 'Overview', icon: LayoutDashboard },
          { to: '/admin/students', label: 'Students', icon: Users },
          { to: '/admin/guardians', label: 'Guardians', icon: UserCheck },
          { to: '/admin/teachers', label: 'Teachers', icon: GraduationCap },
          { to: '/admin/classes', label: 'Classes & Sections', icon: School },
          { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
          { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
          { to: '/admin/exams', label: 'Examinations', icon: Award },
          { to: '/admin/fees', label: 'Fee Management', icon: DollarSign },
          { to: '/admin/audit', label: 'Audit Trail', icon: ShieldCheck },
        ];
      case 'TEACHER':
        return [
          { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarCheck },
          { to: '/teacher/marks', label: 'Enter Exam Marks', icon: Award },
        ];
      case 'GUARDIAN':
        return [
          { to: '/guardian', label: 'Student Profile', icon: LayoutDashboard },
          { to: '/guardian/attendance', label: 'Attendance History', icon: CalendarCheck },
          { to: '/guardian/reports', label: 'Report Cards', icon: Award },
          { to: '/guardian/fees', label: 'Fees & Payments', icon: DollarSign },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">ALGIONS SMS</h1>
            <p className="text-[11px] text-indigo-400 font-medium">School Management</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/50">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Active Workspace
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-200">{user?.role} PORTAL</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/teacher' || link.to === '/guardian'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        Algions Assessment v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
