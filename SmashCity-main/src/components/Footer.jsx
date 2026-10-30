import React from 'react';
import { Flame, ArrowRight } from 'lucide-react';

const Footer = ({ onNavigate }) => {
  return (
    <footer id="contact" className="bg-[#0A0A0A] pt-24 pb-8 border-t-8 border-accent relative overflow-hidden">
      
      {/* Massive Background Watermark */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none opacity-5 select-none flex justify-center -translate-y-1/4">
        <span className="text-[25vw] font-chunky text-white whitespace-nowrap">SMASH</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-16 relative z-10">
        
        {/* Brand Column */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-3 mb-8">
            <Flame className="w-10 h-10 text-accent" strokeWidth={2.5} />
            <span className="font-chunky text-6xl md:text-7xl tracking-wide text-white">Smash<span className="text-accent">City</span></span>
          </div>
          <p className="text-gray-400 font-medium max-w-sm text-lg mb-8">
            The best chicken burger in town, hot off the grill. Smashed to perfection. 
          </p>
          
          <div className="flex gap-4">
            {['IG', 'TW', 'FB'].map(social => (
              <a key={social} href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-black transition-all duration-300 text-white font-bold tracking-widest text-sm">
                {social}
              </a>
            ))}
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="md:col-span-2">
          <h4 className="font-black font-display text-2xl uppercase tracking-widest text-white mb-8">Links</h4>
          <ul className="space-y-4 text-gray-400 font-bold text-sm">
            {[
              { name: 'Home', href: '#' },
              { name: 'Menu', href: '#menu' },
              { name: 'Locations', href: '#locations' }
            ].map(link => (
              <li key={link.name}>
                <a href={link.href} className="hover:text-accent hover:pl-2 transition-all uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-accent rounded-full"></span> {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Get the App */}
        <div className="md:col-span-5">
          <h4 className="font-black font-display text-2xl uppercase tracking-widest text-white mb-8">Get the App</h4>
          <p className="text-gray-400 font-medium mb-6">Skip the line, earn free chicken, and access secret menu items exclusively on the SmashCity app.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {['App Store', 'Google Play'].map(store => (
              <button key={store} className="flex-1 border-2 border-gray-700 hover:border-accent hover:text-accent text-white font-bold uppercase tracking-widest py-4 px-6 rounded transition-all duration-300 flex items-center justify-center gap-2">
                {store}
              </button>
            ))}
          </div>
        </div>
        
      </div>
      
      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-24 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest gap-4 relative z-10">
        <span>&copy; {new Date().getFullYear()} SmashCity. All rights reserved.</span>
        <span className="text-accent flex items-center gap-2">
          <Flame className="w-4 h-4" /> 100% Premium Chicken
        </span>
      </div>
    </footer>
  );
};

export default Footer;
