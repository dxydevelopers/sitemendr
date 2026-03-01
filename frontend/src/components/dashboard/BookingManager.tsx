'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  User, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Trash2,
  Edit
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  service: Service;
  user: {
    name: string;
    email: string;
  };
}

interface BookingManagerProps {
  isAdmin?: boolean;
  subscriptionId?: string;
}

export default function BookingManager({ isAdmin = false, subscriptionId }: BookingManagerProps) {
  const [activeTab, setActiveTab] = useState<'appointments' | 'services'>('appointments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddService, setShowAddService] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    startTime: '',
    notes: ''
  });
  
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: '',
    price: ''
  });

  useEffect(() => {
    fetchData();
  }, [subscriptionId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingsData, servicesData] = await Promise.all([
        isAdmin ? apiClient.getAdminBookings() : apiClient.getUserBookings(subscriptionId),
        apiClient.getAllServices(subscriptionId)
      ]);
      setBookings((isAdmin ? (bookingsData as { data: Booking[] }).data : bookingsData as Booking[]) || []);
      setServices(servicesData as Service[] || []);
    } catch (error) {
      console.error('Failed to fetch booking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.updateBookingStatus(id, status);
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Permanently delete this booking record?')) return;
    try {
      await apiClient.deleteBooking(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingService) {
        await apiClient.updateService(editingService.id, {
          ...newService,
          duration: parseInt(newService.duration),
          price: parseFloat(newService.price)
        });
      } else {
        await apiClient.createService({
          ...newService,
          subscriptionId
        });
      }
      setShowAddService(false);
      setEditingService(null);
      setNewService({ name: '', description: '', duration: '', price: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Permanently decommission this service module?')) return;
    try {
      await apiClient.deleteService(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleEditServiceInitiate = (service: Service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      description: service.description,
      duration: service.duration.toString(),
      price: service.price.toString()
    });
    setShowAddService(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setIsSubmitting(true);
    
    try {
      await apiClient.createBooking({
        serviceId: selectedService.id,
        startTime: bookingForm.startTime,
        notes: bookingForm.notes,
        subscriptionId
      });
      setShowBookModal(false);
      setBookingForm({ startTime: '', notes: '' });
      setSelectedService(null);
      fetchData();
      alert('Consultation request sent successfully!');
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-expert-green" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-ai-blue animate-pulse" />;
      default: return <AlertCircle className="w-4 h-4 text-white/40" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-ai-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 lg:px-6 py-2 rounded-lg font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'appointments' ? 'bg-ai-blue text-white shadow-lg shadow-ai-blue/20' : 'text-white/40 hover:text-white'
            }`}
          >
            LOGS
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 lg:px-6 py-2 rounded-lg font-black text-[9px] lg:text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'services' ? 'bg-ai-blue text-white shadow-lg shadow-ai-blue/20' : 'text-white/40 hover:text-white'
            }`}
          >
            MODULES
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input 
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-48"
          />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors"
          >
            <option value="ALL">ALL_STATUS</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          {activeTab === 'services' && isAdmin && (
            <button
              onClick={() => {
                setEditingService(null);
                setNewService({ name: '', description: '', duration: '', price: '' });
                setShowAddService(true);
              }}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-expert-green text-dark-bg rounded-xl hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Define Module
            </button>
          )}
        </div>
      </div>

      {activeTab === 'appointments' ? (
        <div className="space-y-4">
          {bookings
            .filter(b => 
              (filterStatus === 'ALL' || b.status === filterStatus) &&
              ((b.service?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
               (b.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
               (b.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .map((booking) => (
            <div key={booking.id} className="bg-white/[0.02] border border-white/10 rounded-[32px] p-6 lg:p-8 hover:border-ai-blue/30 transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-black text-white/40 uppercase">{new Date(booking.startTime).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-2xl font-black text-white">{new Date(booking.startTime).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg uppercase tracking-tight mb-1">{booking.service?.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-white/40 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ai-blue" />
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-tech-purple" />
                        {isAdmin ? (booking.user?.name || booking.user?.email || 'Guest') : 'Client Session'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                  <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                    {getStatusIcon(booking.status)}
                    {isAdmin ? (
                      <select 
                        value={booking.status}
                        onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-white/60 focus:ring-0 cursor-pointer p-0"
                      >
                        <option value="PENDING" className="bg-darker-bg">PENDING</option>
                        <option value="CONFIRMED" className="bg-darker-bg">CONFIRMED</option>
                        <option value="CANCELLED" className="bg-darker-bg">CANCELLED</option>
                        <option value="COMPLETED" className="bg-darker-bg">COMPLETED</option>
                      </select>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{booking.status}</span>
                    )}
                  </div>
                  {isAdmin ? (
                    <button 
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:border-white/20 transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <div className="py-24 text-center bg-white/[0.01] border border-white/5 border-dashed rounded-[40px]">
              <Calendar className="w-16 h-16 text-white/5 mx-auto mb-6" />
              <p className="text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">Chronos ledger empty - no sessions scheduled</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
          {services
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((service) => (
            <div 
              key={service.id} 
              onClick={() => {
                if (!isAdmin) {
                  setSelectedService(service);
                  setShowBookModal(true);
                }
              }}
              className={`bg-white/[0.02] border border-white/10 rounded-[32px] p-8 hover:border-ai-blue/30 transition-all flex flex-col justify-between group ${!isAdmin ? 'cursor-pointer hover:bg-white/[0.03]' : ''}`}
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-ai-blue/10 border border-ai-blue/20 rounded-2xl flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-ai-blue" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditServiceInitiate(service); }}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-ai-blue/10 hover:border-ai-blue/30 text-white/40 hover:text-ai-blue transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 hover:border-red-500/30 text-white/40 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{service.name}</h3>
                  <p className="text-white/40 text-[11px] lg:text-xs line-clamp-2 leading-relaxed uppercase font-medium">{service.description}</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-white/60 uppercase tracking-widest">
                    {service.duration} MINS
                  </div>
                  <div className="px-4 py-1.5 bg-ai-blue/10 border border-ai-blue/20 rounded-full text-[9px] font-black text-ai-blue uppercase tracking-widest">
                    ${service.price}
                  </div>
                </div>
              </div>
              {!isAdmin && (
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-ai-blue opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-[0.2em]">Initialize_Session</span>
                  <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-ai-blue group-hover:translate-x-1 transition-all" />
                </div>
              )}
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white/[0.01] border border-white/5 border-dashed rounded-[40px]">
              <Briefcase className="w-16 h-16 text-white/5 mx-auto mb-6" />
              <p className="text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">No service modules available for deployment</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10 bg-black/90 backdrop-blur-2xl">
          <div className="absolute inset-0" onClick={() => setShowAddService(false)}></div>
          <div className="bg-darker-bg border border-white/10 rounded-[40px] w-full max-w-2xl p-8 lg:p-12 relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl">
            <h2 className="text-2xl lg:text-3xl font-black mb-8 lg:mb-10 tracking-tighter uppercase">
              {editingService ? 'Update' : 'Define'} <span className="text-ai-blue italic">Service Module</span>
            </h2>
            <form onSubmit={handleAddService} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Module Name</label>
                    <input
                      type="text"
                      required
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Strategic Consultation"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Runtime (Min)</label>
                      <input
                        type="number"
                        required
                        value={newService.duration}
                        onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Fee ($)</label>
                      <input
                        type="number"
                        required
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Module Definition</label>
                    <textarea
                      required
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all h-32 lg:h-[148px] resize-none text-sm font-medium leading-relaxed"
                      placeholder="Detail the parameters of this service module..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="order-2 sm:order-1 flex-1 px-8 py-5 border border-white/10 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="order-1 sm:order-2 flex-[2] px-8 py-5 bg-ai-blue text-white rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,102,255,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting...' : editingService ? 'Commit Changes' : 'Authorize Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Service Modal */}
      {showBookModal && selectedService && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10 bg-black/90 backdrop-blur-2xl">
          <div className="absolute inset-0" onClick={() => setShowBookModal(false)}></div>
          <div className="bg-darker-bg border border-white/10 rounded-[40px] w-full max-w-lg p-8 lg:p-12 relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="mb-10">
              <span className="text-[9px] font-black text-ai-blue uppercase tracking-[0.3em] mb-2 block">New Booking</span>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase">
                Reserve <span className="text-white italic">{selectedService.name}</span>
              </h2>
            </div>
            
            <form onSubmit={handleCreateBooking} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Temporal Alignment (Start Time)</label>
                <input
                  type="datetime-local"
                  required
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all text-sm font-medium text-white [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Contextual Brief (Notes)</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-ai-blue focus:outline-none transition-all h-32 resize-none text-sm font-medium leading-relaxed"
                  placeholder="Provide any relevant data points for this session..."
                />
              </div>
              
              <div className="flex flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-ai-blue text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,102,255,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting...' : 'Confirm Reservation'}
                </button>
                <p className="text-center text-[8px] font-black text-white/20 uppercase tracking-widest">
                  Secure end-to-end encrypted session
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
