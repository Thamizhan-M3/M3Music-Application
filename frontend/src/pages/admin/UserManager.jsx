import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Edit2, Trash2, Shield, User, Mail, Key, X, Check } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get(`/api/auth/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axiosInstance.put(`/api/auth/users/${editingUser._id}`, formData);
      } else {
        await axiosInstance.post(`/api/auth/users`, formData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axiosInstance.delete(`/api/auth/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-zinc-400">Create and manage access for your platform</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'user' }); setIsModalOpen(true); }}
          className="btn-neon flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      <div className="glass-card mb-8">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by username or email..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 border border-white/10 overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{u.username}</p>
                        <p className="text-xs text-zinc-500">{u.email || 'No email set'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingUser(u); setFormData({ ...u, password: '' }); setIsModalOpen(true); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteUser(u._id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                {editingUser ? <Edit2 className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:border-primary transition-all outline-none"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                    <input 
                      type="email" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:border-primary transition-all outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Password {editingUser && '(Leave blank to keep current)'}</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                    <input 
                      type="password" 
                      required={!editingUser}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:border-primary transition-all outline-none"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Role</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'user'})}
                      className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.role === 'user' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'}`}
                    >
                      <User className="w-4 h-4" />
                      User
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'admin'})}
                      className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.role === 'admin' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'}`}
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full btn-neon py-3 mt-6">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManager;
