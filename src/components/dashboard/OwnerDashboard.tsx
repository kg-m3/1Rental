import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const OwnerDashboard = () => {
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeBookings: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    // Fetch equipment
    const { data: equipmentData } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });

    if (equipmentData) {
      setEquipment(equipmentData);
      setStats(prev => ({ ...prev, totalEquipment: equipmentData.length }));
    }

    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        *,
        equipment:equipment_id (title)
      `)
      .order('created_at', { ascending: false });

    if (bookingsData) {
      setBookings(bookingsData);
      const activeBookings = bookingsData.filter(b => b.status === 'active').length;
      const totalEarnings = bookingsData
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.total_amount, 0);
      
      setStats(prev => ({
        ...prev,
        activeBookings,
        totalEarnings,
      }));
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: action === 'approve' ? 'active' : 'rejected' })
      .eq('id', bookingId);

    if (!error) {
      fetchOwnerData();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Equipment</p>
              <h3 className="text-2xl font-bold">{stats.totalEquipment}</h3>
            </div>
            <Package className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active Bookings</p>
              <h3 className="text-2xl font-bold">{stats.activeBookings}</h3>
            </div>
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Earnings</p>
              <h3 className="text-2xl font-bold">R{stats.totalEarnings}</h3>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Equipment List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your Equipment</h2>
            <Link
              to="/list-equipment"
              className="flex items-center text-yellow-600 hover:text-yellow-700"
            >
              <Plus className="h-5 w-5 mr-1" />
              Add New
            </Link>
          </div>

          <div className="space-y-4">
            {equipment.map((item: any) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.location}</p>
                  </div>
                  <span className="text-green-600 font-semibold">
                    R{item.rate}/day
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    item.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                  <Link
                    to={`/equipment/${item.id}/edit`}
                    className="text-gray-600 hover:text-yellow-600"
                  >
                    <Settings className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Requests */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-6">Recent Booking Requests</h2>
          <div className="space-y-4">
            {bookings.map((booking: any) => (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{booking.equipment?.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : booking.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                {booking.status === 'pending' && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => handleBookingAction(booking.id, 'approve')}
                      className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleBookingAction(booking.id, 'reject')}
                      className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;