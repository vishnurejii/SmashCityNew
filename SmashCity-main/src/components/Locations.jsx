import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Locations = () => {
  const { openCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();

  return (
    <section id="about" className="py-24 bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        
        <div>
          <h2 className="text-5xl md:text-7xl font-['Montserrat'] font-black tracking-tight text-accent mb-4">FIND THE GRILL.</h2>
          <p className="text-xl md:text-3xl font-['Caveat'] italic text-gray-300 font-bold mb-10 max-w-md">
            We're located right in the heart of the city. Follow the smoke.
          </p>
          
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
               <div className="w-12 h-12 bg-accent/10 rounded flex items-center justify-center shrink-0 border border-accent/20">
                  <MapPin className="w-6 h-6 text-accent" />
               </div>
               <div>
                  <h4 className="text-2xl font-display tracking-wide mb-1">Downtown Flagship</h4>
                  <p className="text-text-secondary font-medium">404 Smash Avenue<br/>(Next to the old theater)</p>
               </div>
            </div>
            
            <div className="flex gap-4 items-start">
               <div className="w-12 h-12 bg-accent/10 rounded flex items-center justify-center shrink-0 border border-accent/20">
                  <Clock className="w-6 h-6 text-accent" />
               </div>
               <div>
                  <h4 className="text-2xl font-display tracking-wide mb-1">Hours of Operation</h4>
                  <ul className="text-text-secondary font-medium space-y-2 mt-2">
                     <li className="flex justify-between w-full sm:w-64 border-b border-border pb-1">
                        <span>Sun - Thu</span>
                        <span className="font-bold text-white">11am - 10pm</span>
                     </li>
                     <li className="flex justify-between w-full sm:w-64 border-b border-border pb-1">
                        <span>Fri - Sat</span>
                        <span className="font-bold text-white">11am - 2am</span>
                     </li>
                     <li className="flex justify-between w-full sm:w-64 pt-1">
                        <span className="text-accent uppercase tracking-widest text-xs font-bold mt-1">Open 7 days a week</span>
                     </li>
                  </ul>
               </div>
            </div>
          </div>

          {/* Call to Action Box */}
          <div className="mt-12 p-8 bg-[#111] rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden group">
             {/* Subtle glow effect */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-accent/20 transition-all duration-500" />
             
             <h4 className="text-2xl font-display tracking-widest uppercase mb-2 text-white relative z-10">Skip the Line.</h4>
             <p className="text-gray-400 font-medium mb-6 text-sm relative z-10">Create an account to save your favorite custom smash burgers and earn rewards.</p>
             <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <button 
                  onClick={openCart}
                  className="flex-1 bg-accent text-black font-bold uppercase tracking-widest py-3 px-4 rounded hover:bg-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                >
                  Order Now
                </button>
                <button 
                  onClick={() => isAuthenticated ? openCart() : openAuthModal('register')}
                  className="flex-1 bg-transparent border-2 border-accent text-accent font-bold uppercase tracking-widest py-3 px-4 rounded hover:bg-accent hover:text-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                >
                  {isAuthenticated ? 'My Smash Bag' : 'Join Crew'}
                </button>
             </div>
          </div>
        </div>

        {/* Storefront Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800 group aspect-[4/3] md:aspect-auto h-full min-h-[400px]">
           <img src="/storefront.webp" alt="SmashCity Storefront at Night" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
           
           <div className="absolute bottom-6 left-6 right-6 z-20">
             <h3 className="text-3xl font-['Montserrat'] font-black text-white tracking-wide drop-shadow-md mb-3">DOWNTOWN HQ</h3>
             <div className="inline-block px-4 py-2 bg-accent text-white text-sm font-bold tracking-widest uppercase rounded shadow-lg">
               Walk-ins & Delivery
             </div>
           </div>
        </div>

      </div>
    </section>
  );
};

export default Locations;
