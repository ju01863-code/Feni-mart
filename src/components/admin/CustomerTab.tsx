import React, { useState } from 'react';
import {
  Users,
  Search,
  Download,
  Edit2,
  Trash2,
  X,
  Plus,
  Phone,
  Calendar,
  ShoppingBag,
  Gift,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { Customer, Order } from '../../types';
import { exportToExcel, exportToCSV } from '../../utils/excelExport';
import { ConfirmModal } from '../ConfirmModal';

interface CustomerTabProps {
  customers: Customer[];
  orders: Order[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
}

export const CustomerTab: React.FC<CustomerTabProps> = ({
  customers,
  orders,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'local' | 'expat'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalOrders, setTotalOrders] = useState<number | ''>(1);
  const [totalPurchase, setTotalPurchase] = useState<number | ''>(0);
  const [giftStatus, setGiftStatus] = useState<'Not Sent' | 'Sent'>('Not Sent');
  const [customerType, setCustomerType] = useState<'local' | 'expat'>('local');
  const [country, setCountry] = useState('বাংলাদেশ (Bangladesh)');

  // Counts for filters
  const typeCounts = {
    all: customers.length,
    local: customers.filter((c) => c.customerType !== 'expat').length,
    expat: customers.filter((c) => c.customerType === 'expat').length,
  };

  const filteredCustomers = customers.filter((c) => {
    // Customer Type Filter: 'all' | 'local' | 'expat'
    if (customerTypeFilter === 'local' && c.customerType === 'expat') {
      return false;
    }
    if (customerTypeFilter === 'expat' && c.customerType !== 'expat') {
      return false;
    }

    const s = searchTerm.toLowerCase();
    const nameMatch = c.name.toLowerCase().includes(s);
    const phoneMatch = c.phone.includes(searchTerm);
    const addressMatch = (c.address || '').toLowerCase().includes(s);
    const countryMatch = (c.country || '').toLowerCase().includes(s);

    return nameMatch || phoneMatch || addressMatch || countryMatch;
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setTotalOrders(1);
    setTotalPurchase(0);
    setGiftStatus('Not Sent');
    setCustomerType('local');
    setCountry('বাংলাদেশ (Bangladesh)');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setTotalOrders(c.totalOrders || 0);
    setTotalPurchase(c.totalPurchase || 0);
    setGiftStatus(c.giftStatus || 'Not Sent');
    setCustomerType(c.customerType || 'local');
    setCountry(c.country || (c.customerType === 'expat' ? 'প্রবাসী' : 'বাংলাদেশ (Bangladesh)'));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('অনুগ্রহ করে কাস্টমারের নাম ও মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    try {
      const payload: Omit<Customer, 'id'> = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        firstOrder: editingCustomer?.firstOrder || new Date().toISOString().split('T')[0],
        lastOrder: new Date().toISOString().split('T')[0],
        totalOrders: Number(totalOrders || 1),
        totalPurchase: Number(totalPurchase || 0),
        giftStatus,
        customerType,
        country: customerType === 'local' ? 'বাংলাদেশ (Bangladesh)' : (country.trim() || 'প্রবাসী'),
        createdAt: editingCustomer?.createdAt || new Date().toISOString(),
      };

      if (editingCustomer?.id) {
        await onUpdateCustomer(editingCustomer.id, payload);
        setSuccessMessage('সফলভাবে আপডেট হয়েছে');
      } else {
        await onAddCustomer(payload);
        setSuccessMessage('সফলভাবে সেভ হয়েছে');
      }

      setTimeout(() => setSuccessMessage(null), 3000);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving customer:', err);
      setErrorMessage('কিছু ভুল হয়েছে। আবার চেষ্টা করুন।');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete?.id) return;
    try {
      setIsDeleting(true);
      await onDeleteCustomer(customerToDelete.id);
      setSuccessMessage('সফলভাবে মুছে ফেলা হয়েছে');
      setTimeout(() => setSuccessMessage(null), 3000);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
      setErrorMessage('কিছু ভুল হয়েছে। আবার চেষ্টা করুন।');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const data = filteredCustomers.map((c, idx) => ({
      ক্রমিক: idx + 1,
      কাস্টমার_নাম: c.name,
      মোবাইল: c.phone,
      ধরন: c.customerType === 'expat' ? 'প্রবাসী' : 'দেশি',
      দেশ: c.country || (c.customerType === 'expat' ? 'প্রবাসী' : 'বাংলাদেশ'),
      ঠিকানা: c.address,
      প্রথম_অর্ডার_তারিখ: c.firstOrder,
      সর্বশেষ_অর্ডার_তারিখ: c.lastOrder,
      মোট_অর্ডার_সংখ্যা: c.totalOrders,
      মোট_ক্রয়_টাকা: c.totalPurchase,
      উপহার_স্ট্যাটাস: c.giftStatus === 'Sent' ? 'পাঠানো হয়েছে' : 'পাঠানো হয়নি',
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    if (format === 'xlsx') {
      exportToExcel(data, `FeniMart_Customers_${dateStr}`, 'Customers');
    } else {
      exportToCSV(data, `FeniMart_Customers_${dateStr}`);
    }
  };

  // Get orders of selected customer
  const customerOrders = selectedCustomerForHistory
    ? orders.filter(
        (o) =>
          o.phone.replace(/[^0-9]/g, '') ===
            selectedCustomerForHistory.phone.replace(/[^0-9]/g, '') ||
          o.customerName.toLowerCase() === selectedCustomerForHistory.name.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-6 pb-24">
      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn border-2 border-emerald-400">
          <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base">
            <CheckCircle className="w-5 h-5 text-[#FFE0A8]" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn border-2 border-rose-400">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-white" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0A4A29] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1E8A52]" />
            <span>কাস্টমার ডাটাবেজ (Customer Database)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            মোট নিবন্ধিত কাস্টমার: <span className="font-bold text-slate-800">{customers.length}</span> জন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition border border-slate-300 min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition border border-slate-300 min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#0A4A29] hover:bg-[#1E8A52] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer min-h-[48px]"
          >
            <Plus className="w-4 h-4 text-[#FFB300]" />
            <span>নতুন কাস্টমার যোগ</span>
          </button>
        </div>
      </div>

      {/* Origin Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Customer Origin Filter Tabs: All, Bangladeshi, Expat */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          <button
            type="button"
            onClick={() => setCustomerTypeFilter('all')}
            className={`min-h-[44px] px-4 py-2 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 ${
              customerTypeFilter === 'all'
                ? 'bg-[#0A4A29] text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🔵 সব কাস্টমার</span>
            <span className="bg-black/15 text-inherit px-2 py-0.5 rounded-full text-xs font-bold">
              {typeCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerTypeFilter('local')}
            className={`min-h-[44px] px-4 py-2 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 ${
              customerTypeFilter === 'local'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>🇧🇩 দেশি কাস্টমার</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${customerTypeFilter === 'local' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
              {typeCounts.local}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerTypeFilter('expat')}
            className={`min-h-[44px] px-4 py-2 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 ${
              customerTypeFilter === 'expat'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <span>🌍 প্রবাসী কাস্টমার</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${customerTypeFilter === 'expat' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-900'}`}>
              {typeCounts.expat}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, ফোন নম্বর, দেশ বা ঠিকানা সার্চ করুন..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#1E8A52]"
          />
        </div>
      </div>

      {/* Customers Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#0A4A29]/5 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">কাস্টমারের তথ্য</th>
                <th className="px-4 py-3.5">ঠিকানা</th>
                <th className="px-4 py-3.5">প্রথম ও শেষ অর্ডার</th>
                <th className="px-4 py-3.5 text-center">মোট অর্ডার</th>
                <th className="px-4 py-3.5">মোট ক্রয় (টাকা)</th>
                <th className="px-4 py-3.5">গিফট স্ট্যাটাস</th>
                <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700">এখনো কোনো কাস্টমার তথ্য নেই।</p>
                      <p className="text-xs text-slate-400">নতুন কাস্টমার যুক্ত করতে উপরের বাটনে ক্লিক করুন।</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id || c.phone} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div
                          onClick={() => setSelectedCustomerForHistory(c)}
                          className="font-bold text-slate-900 hover:text-[#1E8A52] cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{c.name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>

                        {/* Customer Type Badge */}
                        {c.customerType === 'expat' ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200">
                            <Globe className="w-2.5 h-2.5 text-indigo-600" />
                            <span>প্রবাসী {c.country && c.country !== 'প্রবাসী' && c.country !== 'বাংলাদেশ (Bangladesh)' ? `(${c.country.split('(')[0].trim()})` : ''}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-emerald-200">
                            <span>🇧🇩 দেশি</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#0A4A29]" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                      {c.address || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      <div>প্রথম: {c.firstOrder || '—'}</div>
                      <div className="font-semibold text-slate-700">শেষ: {c.lastOrder || '—'}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 text-center">
                      {c.totalOrders}
                    </td>
                    <td className="px-4 py-3 font-black text-[#0A4A29] text-base whitespace-nowrap">
                      ৳ {Number(c.totalPurchase || 0).toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.giftStatus === 'Sent'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Gift className="w-3 h-3" />
                        <span>{c.giftStatus === 'Sent' ? 'পাঠানো হয়েছে' : 'পাঠানো হয়নি'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCustomerForHistory(c)}
                          className="px-2.5 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-[#0A4A29] rounded-lg font-bold transition cursor-pointer"
                        >
                          অর্ডার হিস্ট্রি
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-600 hover:text-[#0A4A29] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCustomerToDelete(c)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              এখনো কোনো কাস্টমার তথ্য নেই।
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div key={c.id || c.phone} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{c.name}</h3>
                      {c.customerType === 'expat' ? (
                        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200">
                          <Globe className="w-2.5 h-2.5 text-indigo-600" />
                          <span>প্রবাসী {c.country && c.country !== 'প্রবাসী' && c.country !== 'বাংলাদেশ (Bangladesh)' ? `(${c.country.split('(')[0].trim()})` : ''}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-emerald-200">
                          <span>🇧🇩 দেশি</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[#0A4A29] font-semibold mt-1">
                      <Phone className="w-3.5 h-3.5 text-[#1E8A52]" />
                      <a href={`tel:${c.phone}`} className="hover:underline">
                        {c.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="সম্পাদনা"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCustomerToDelete(c)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {c.address && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {c.address}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">মোট অর্ডার</span>
                    <span className="font-bold text-slate-800 text-sm">{c.totalOrders} টি</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">মোট ক্রয়মূল্য</span>
                    <span className="font-black text-[#0A4A29] text-base">
                      ৳ {Number(c.totalPurchase || 0).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      c.giftStatus === 'Sent'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Gift className="w-3 h-3" />
                    <span>{c.giftStatus === 'Sent' ? 'উপহার পাঠানো হয়েছে' : 'উপহার পাঠানো হয়নি'}</span>
                  </span>

                  <button
                    onClick={() => setSelectedCustomerForHistory(c)}
                    className="px-3 py-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-[#0A4A29] rounded-xl font-bold transition min-h-[40px] cursor-pointer"
                  >
                    হিস্ট্রি দেখুন
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 relative my-4 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0A4A29]">
                  {selectedCustomerForHistory.name} - অর্ডার হিস্ট্রি
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ফোন: {selectedCustomerForHistory.phone} | মোট ক্রয়: ৳{' '}
                  {Number(selectedCustomerForHistory.totalPurchase || 0).toLocaleString('en-US')}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-6 space-y-3 flex-1 pb-12">
              {customerOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  এই কাস্টমারের কোনো পূর্ববর্তী অর্ডার রেকর্ড পাওয়া যায়নি।
                </div>
              ) : (
                customerOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div>
                      <span className="text-slate-400 text-[11px] block">{o.date}</span>
                      <strong className="text-slate-900 font-bold text-base block">{o.product}</strong>
                      <span className="text-slate-500">
                        {o.quantity} পিস × ৳{o.unitPrice} | পেমেন্ট: {o.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-[#0A4A29] block">৳ {o.total}</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.status === 'Delivered' ? 'ডেলিভার্ড' : 'পেন্ডিং'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 relative my-4 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 shrink-0">
              <h3 className="text-lg sm:text-xl font-black text-[#0A4A29]">
                {editingCustomer ? 'কাস্টমার তথ্য সম্পাদনা' : 'নতুন কাস্টমার নিবন্ধন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 pb-16">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  কাস্টমারের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোঃ ইকবাল হোসেন"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#1E8A52] min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 018XXXXXXXX"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#1E8A52] min-h-[48px]"
                />
              </div>

              {/* Customer Type Selection: Local vs Expat */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  কাস্টমার ধরন (Customer Type) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerType('local');
                      setCountry('বাংলাদেশ (Bangladesh)');
                    }}
                    className={`min-h-[44px] p-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      customerType === 'local'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>🇧🇩 দেশি কাস্টমার</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType('expat')}
                    className={`min-h-[44px] p-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      customerType === 'expat'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>🌍 প্রবাসী কাস্টমার</span>
                  </button>
                </div>

                {customerType === 'expat' && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      অবস্থানরত দেশ (Country) *
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="যেমন: সৌদি আরব, দুবাই (UAE), কাতার, কুয়েত, মালয়েশিয়া..."
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      required={customerType === 'expat'}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ঠিকানা</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="যেমন: শান্তি কোম্পানি মোড়, ফেনী"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#1E8A52]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    মোট অর্ডার সংখ্যা
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={totalOrders}
                    onChange={(e) => setTotalOrders(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    মোট ক্রয়মূল্য (টাকা)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={totalPurchase}
                    onChange={(e) => setTotalPurchase(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  উপহার স্ট্যাটাস
                </label>
                <select
                  value={giftStatus}
                  onChange={(e) => setGiftStatus(e.target.value as 'Not Sent' | 'Sent')}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base min-h-[48px] bg-white font-medium"
                >
                  <option value="Not Sent">পাঠানো হয়নি (Not Sent)</option>
                  <option value="Sent">পাঠানো হয়েছে (Sent)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition min-h-[48px]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-[#0A4A29] hover:bg-[#1E8A52] text-white px-6 py-3 rounded-xl text-sm font-bold transition shadow-md min-h-[48px] cursor-pointer"
                >
                  {editingCustomer ? 'আপডেট করুন' : 'কাস্টমার সংরক্ষণ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title="কাস্টমার মুছে ফেলার নিশ্চিতকরণ"
        message={`আপনি কি নিশ্চিত? "${customerToDelete?.name}" কাস্টমারটির সকল তথ্য মুছে ফেলা হবে।`}
        warningNote="কাস্টমার মুছে ফেললে তার পূর্ববর্তী ক্রয়ের ইতিহাস ও গিফট ট্র্যাকিং তালিকা থেকে তথ্য অপসারণ হতে পারে।"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        cancelLabel="না, বাতিল"
        isProcessing={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
