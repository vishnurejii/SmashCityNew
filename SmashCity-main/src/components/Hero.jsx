import React from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Hero = () => {
  const { openCart } = useCart();

  return (
    <section 
      className="relative min-h-[100svh] pt-32 pb-32 flex items-center bg-cover bg-[position:85%_center] md:bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/burger-hero.webp')" }}
    >
      {/* 50% Dark Overlay on the Left */}
      <div className="absolute inset-y-0 left-0 w-full md:w-1/2 bg-black/50 md:bg-black/30 z-0 pointer-events-none border-r border-white/5" />
      
      <div className="w-full px-8 md:px-16 flex items-center z-10 h-full">
        
        {/* Left Content - Centered horizontally in the 50% box */}
        <div className="w-full md:w-1/2 flex flex-col items-center text-center space-y-8 shrink-0 md:pr-8">
          <div className="w-full flex justify-start">
            <div className="inline-flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-red-500 animate-pulse" />
              <p className="text-red-500 text-sm font-bold tracking-[0.2em] uppercase">
                Premium Burgers
              </p>
            </div>
          </div>
          
          <h1 className="text-7xl sm:text-8xl md:text-[140px] leading-none font-chunky tracking-normal flex flex-col items-center gap-2 drop-shadow-2xl mb-6">
            <span>Smash</span>
            <span className="text-accent">City</span>
          </h1>
          
          <p className="text-xl md:text-2xl font-['Caveat'] font-bold italic text-white/90 leading-relaxed w-full max-w-xl text-center">
            Welcome to Smash City. Crispy edges, juicy centers, and melted cheese on a toasted potato bun. The best burger in town, hot off the grill.
          </p>
          
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm mx-auto sm:max-w-none">
            <a 
              href="#menu" 
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-white text-black text-[16px] font-bold tracking-widest uppercase rounded hover:bg-gray-200 transition-colors shadow-lg"
            >
              See the Menu
              <ArrowRight className="w-5 h-5" />
            </a>
            <button 
              onClick={openCart}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white text-[16px] font-bold tracking-widest uppercase rounded hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              Get One Now
            </button>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default Hero;
