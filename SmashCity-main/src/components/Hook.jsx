import React from 'react';
import { motion } from 'framer-motion';

const Hook = () => {
  return (
    <section className="py-24 bg-[url('/hook-bg.webp')] bg-cover bg-center bg-fixed relative overflow-hidden">
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-black/70 z-0" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-5xl md:text-7xl font-['Montserrat'] font-black tracking-tight text-accent mb-8"
        >
          NO SHORTCUTS.
        </motion.h2>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-6 text-xl md:text-3xl font-['Caveat'] italic text-text-secondary leading-relaxed max-w-3xl mx-auto text-left md:text-center"
        >
          <p>
            We don't do frozen patties. We don't do soggy buns. Every burger that leaves our kitchen is a testament to the art of the smash. 
          </p>
          <p>
            We grind our proprietary blend of premium chicken breast and thigh daily. Our grills hit 400 degrees to guarantee that perfect, crispy lace edge while keeping the center dangerously juicy. It's not fast food. It's good food, made fast.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hook;
