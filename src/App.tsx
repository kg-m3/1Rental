import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import HowItWorks from './components/HowItWorks';
import FeaturedEquipment from './components/FeaturedEquipment';
import ListingCTA from './components/ListingCTA';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AllEquipment from './pages/AllEquipment';
import EquipmentDetails from './pages/EquipmentDetails';
import ListEquipment from './pages/ListEquipment';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import OwnerDashboard from './components/dashboard/OwnerDashboard';
import RenterDashboard from './components/dashboard/RenterDashboard';
import Profile from './components/Profile';

function App() {
  const { setUser, fetchUserRoles } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserRoles(currentUser.id);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchUserRoles(currentUser.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, fetchUserRoles]);

  return (
    <Router>
      <div className="font-sans">
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <About />
                <HowItWorks />
                <FeaturedEquipment />
                <ListingCTA />
                <Contact />
              </>
            }
          />
          <Route path="/equipment" element={<AllEquipment />} />
          <Route path="/equipment/:id" element={<EquipmentDetails />} />
          <Route path="/list-equipment" element={<ListEquipment />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/renterdashboard" element={<RenterDashboard />} />
          <Route path="/ownerdashboard" element={<OwnerDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;