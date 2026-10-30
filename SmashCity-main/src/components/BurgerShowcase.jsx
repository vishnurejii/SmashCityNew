import React from 'react';

const BurgerCard = ({ image, title, subtitle }) => (
  <div className="flex flex-col items-center group">
     <div className="w-full aspect-square rounded-xl overflow-hidden shadow-xl mb-6 relative">
        <img 
           src={image} 
           alt={title} 
           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
     </div>
     <h3 className="font-['Caveat'] text-4xl text-gray-900 tracking-wider font-bold">{title}</h3>
     <p className="text-xs text-gray-500 uppercase tracking-widest mt-2 font-bold">{subtitle}</p>
  </div>
);

const BurgerShowcase = () => {
  return (
    <section className="w-full relative bg-[#E3D8C3] pt-12 pb-24">
      
      {/* Wavy Divider Overlaying the Hero Section above */}
      <div className="absolute top-0 left-0 w-full h-16 -translate-y-full z-20 pointer-events-none" style={{ filter: 'drop-shadow(0px -2px 6px rgba(0,0,0,0.2))' }}>
        <svg width="100%" height="100%" viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,50 C360,130 720,-30 1080,50 L1440,80 L1440,100 L0,100 Z" fill="#E3D8C3" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Column 1 */}
        <BurgerCard 
          image="/burger-1.webp" 
          title="Classic Chicken" 
          subtitle="Juicy patty with fresh lettuce" 
        />

        {/* Column 2: Text Only */}
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl shadow-xl">
           <h2 className="font-display text-5xl md:text-6xl text-red-600 tracking-widest uppercase mb-6">
             SAUCE
           </h2>
           <div className="space-y-4 font-['Caveat'] text-2xl text-gray-800 font-bold">
              <p>House-made Special Sauce</p>
              <p>Caramelized Onion Jam</p>
              <p>Blazing Habanero Aioli</p>
              <p>Smoked Garlic Mayo</p>
           </div>
           <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mt-8 font-bold">Made fresh every morning.</p>
        </div>

        {/* Column 3 */}
        <BurgerCard 
          image="/burger-2.webp" 
          title="Double Smash" 
          subtitle="Twice the meat, twice the cheese" 
        />

        {/* Column 4 */}
        <BurgerCard 
          image="/burger-3.webp" 
          title="The Inferno" 
          subtitle="Spicy pepper jack and red onions" 
        />

      </div>
    </section>
  );
};

export default BurgerShowcase;

