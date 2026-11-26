import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Minus, RotateCcw, ShoppingBag, Sparkles, Check, Sliders, Layers 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

// Master specifications for all 8 photorealistic layers
const BURGER_LAYERS_SPEC = [
  {
    id: 'bun-top',
    name: 'Brioche Crown Bun',
    category: 'Crown Bun',
    img: '/layers/bun-top.png',
    calories: 140,
    dimension: 'Ø 115 mm',
    price: 1.50,
    align: 'left',
    description: 'Golden-toasted brioche dome with roasted sesame seeds',
    isBase: true
  },
  {
    id: 'onion',
    name: 'Caramelized Onion Rings',
    category: 'Onions',
    img: '/layers/onion.png',
    calories: 28,
    dimension: 'Ring cut',
    price: 0.60,
    align: 'right',
    description: 'Sweet, savory slow-sautéed golden onion rings'
  },
  {
    id: 'pickle',
    name: 'Crunchy Dill Pickles',
    category: 'Pickles',
    img: '/layers/pickle.png',
    calories: 12,
    dimension: '3 slices',
    price: 0.50,
    align: 'left',
    description: 'Crinkle-cut tangy barrel-aged pickles'
  },
  {
    id: 'tomato',
    name: 'Juicy Garden Tomato',
    category: 'Tomato',
    img: '/layers/tomato.png',
    calories: 18,
    dimension: '8 mm slice',
    price: 0.75,
    align: 'right',
    description: 'Fresh vine-ripened red tomato slice'
  },
  {
    id: 'cheese',
    name: 'Melted American Cheddar',
    category: 'Cheese',
    img: '/layers/cheese.png',
    calories: 110,
    dimension: 'Draped slice',
    price: 1.00,
    align: 'left',
    description: 'Warm, gooey melted yellow cheddar blanket'
  },
  {
    id: 'patty',
    name: 'Smashed Prime Patty',
    category: 'Smashed Patty',
    img: '/layers/patty.png',
    calories: 240,
    dimension: '4oz (118 mm)',
    price: 3.50,
    align: 'right',
    description: '100% prime chicken with crispy lacy caramelized edges'
  },
  {
    id: 'lettuce',
    name: 'Crisp Green Lettuce',
    category: 'Crisp Leaves',
    img: '/layers/lettuce.png',
    calories: 10,
    dimension: 'Fresh leaf',
    price: 0.50,
    align: 'left',
    description: 'Ruffled crisp iceberg lettuce for garden crunch'
  },
  {
    id: 'bun-bottom',
    name: 'Brioche Heel Bun',
    category: 'Heel Bun',
    img: '/layers/bun-bottom.png',
    calories: 120,
    dimension: 'Ø 110 mm',
    price: 1.50,
    align: 'right',
    description: 'Butter-toasted soft sponge foundation base',
    isBase: true
  }
];

const BurgerCustomizer = ({ isOpen, onClose }) => {
  const { addToCart } = useCart();

  // Mode: 'exploded' (Anatomy poster view) | 'stacked' (Fully assembled burger)
  const [viewMode, setViewMode] = useState('exploded');
  
  // Custom Ingredient Selection States
  const [pattyCount, setPattyCount] = useState(1);
  const [cheeseCount, setCheeseCount] = useState(1);
  const [hasTomato, setHasTomato] = useState(true);
  const [hasPickles, setHasPickles] = useState(true);
  const [hasOnion, setHasOnion] = useState(true);
  const [hasLettuce, setHasLettuce] = useState(true);
  const [customBurgerName, setCustomBurgerName] = useState('The Master Smash Anatomy');
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  // Compute Active Layers List, Price, and Calories
  const { layers, totalPrice, totalCalories } = useMemo(() => {
    let list = [];
    let price = 0;
    let cals = 0;

    // 1. Top Bun
    const topBun = BURGER_LAYERS_SPEC[0];
    list.push(topBun);
    price += topBun.price;
    cals += topBun.calories;

    // Top Crisp Lettuce Leaf right after Top Bun
    if (hasLettuce) {
      const topLettuce = {
        ...BURGER_LAYERS_SPEC[6],
        id: 'lettuce-top',
        img: '/layers/lettuce-top.png',
        name: 'Top Crisp Lettuce',
        category: 'Crisp Leaves'
      };
      list.push(topLettuce);
      price += 0.25;
      cals += 5;
    }

    // 2. Onions (optional)
    if (hasOnion) {
      const on = BURGER_LAYERS_SPEC[1];
      list.push(on);
      price += on.price;
      cals += on.calories;
    }

    // 3. Pickles (optional)
    if (hasPickles) {
      const pi = BURGER_LAYERS_SPEC[2];
      list.push(pi);
      price += pi.price;
      cals += pi.calories;
    }

    // 4. Tomato (optional)
    if (hasTomato) {
      const tom = BURGER_LAYERS_SPEC[3];
      list.push(tom);
      price += tom.price;
      cals += tom.calories;
    }

    // 5. Cheese & Patty Stacks (Supports Single, Double, Triple Smash)
    for (let i = 0; i < pattyCount; i++) {
      if (i < cheeseCount) {
        const ch = { 
          ...BURGER_LAYERS_SPEC[4], 
          id: `cheese-${i}`, 
          name: i > 0 ? `Extra Melted Cheese #${i+1}` : 'Melted American Cheddar' 
        };
        list.push(ch);
        price += ch.price;
        cals += ch.calories;
      }

      const pa = { 
        ...BURGER_LAYERS_SPEC[5], 
        id: `patty-${i}`, 
        name: i > 0 ? `Extra Smashed Patty #${i+1}` : 'Smashed Prime Patty' 
      };
      list.push(pa);
      price += pa.price;
      cals += pa.calories;
    }

    // 6. Lettuce (optional)
    if (hasLettuce) {
      const letLayer = BURGER_LAYERS_SPEC[6];
      list.push(letLayer);
      price += letLayer.price;
      cals += letLayer.calories;
    }

    // 7. Bottom Bun
    const botBun = BURGER_LAYERS_SPEC[7];
    list.push(botBun);
    price += botBun.price;
    cals += botBun.calories;

    return {
      layers: list,
      totalPrice: Math.max(5.50, price),
      totalCalories: cals
    };
  }, [pattyCount, cheeseCount, hasTomato, hasPickles, hasOnion, hasLettuce]);

  // Reset to signature build
  const handleReset = () => {
    setPattyCount(1);
    setCheeseCount(1);
    setHasTomato(true);
    setHasPickles(true);
    setHasOnion(true);
    setHasLettuce(true);
    setCustomBurgerName('The Master Smash Anatomy');
    setViewMode('exploded');
  };

  // Add to Smash Bag
  const handleAddCustomToBag = async () => {
    const customProduct = {
      id: 999903,
      name: customBurgerName.trim() || 'Custom Smash Burger',
      price: totalPrice.toFixed(2),
      image_url: '/burger-1.webp',
      type_label: `${pattyCount}x Smashed Chicken Patty`,
      description: `Handcrafted build: ${pattyCount}x Prime Patty, ${cheeseCount}x Cheddar, with fresh toppings (${totalCalories} kcal).`,
      is_available: true
    };

    await addToCart(customProduct, 1);
    setIsSuccessToast(true);
    setTimeout(() => {
      setIsSuccessToast(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[95vh] max-h-[920px] bg-[#121110] border border-white/10 rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden text-white">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/70 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Close customizer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* LEFT PANE: Authentic Layer Anatomy & Exploded Canvas     */}
        {/* ======================================================== */}
        <div 
          className="w-full lg:w-[60%] h-[55%] lg:h-full relative flex flex-col justify-between p-4 sm:p-8 overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-white/10"
          style={{
            background: 'radial-gradient(circle at 50% 40%, #1e1915 0%, #0e0d0c 100%)'
          }}
        >
          {/* Subtle warm alignment lines matching culinary anatomy posters */}
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10 px-8">
            <div className="w-[1px] h-full bg-amber-500" />
            <div className="w-[1px] h-full bg-amber-500" />
            <div className="w-[1px] h-full bg-amber-500" />
          </div>

          {/* Top Anatomy Header with Prominent Mode Switcher */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-white/15 text-xs shadow-lg">
              <button
                onClick={() => setViewMode('exploded')}
                className={`px-3.5 py-1.5 rounded-lg font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'exploded' 
                    ? 'bg-amber-400 text-black shadow-md' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Exploded Anatomy
              </button>
              <button
                onClick={() => setViewMode('stacked')}
                className={`px-3.5 py-1.5 rounded-lg font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'stacked' 
                    ? 'bg-amber-400 text-black shadow-md' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                🍔 Assembled Burger
              </button>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-400 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Stack
            </button>
          </div>

          {/* Center Dynamic Stack with Fluid Leader Lines & Scroll Support */}
          <div className="relative flex-1 flex flex-col items-center my-2 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            
            <div className={`relative w-full max-w-[500px] flex flex-col items-center my-auto ${viewMode === 'exploded' ? 'py-4' : 'py-2'}`}>
              <AnimatePresence>
                {layers.map((layer, index) => {
                  const isExploded = viewMode === 'exploded';

                  // In Assembled Burger mode:
                  // Tight, authentic contact overlap so the entire stack looks like a real, single assembled burger.
                  const getStackedOffset = (id) => {
                    // Top bun adjusted slightly upward to let the top lettuce breathe
                    if (id.startsWith('bun-top')) return 'mb-[-92px] sm:mb-[-110px]';
                    // Top lettuce leaf pulled down firmly so it drapes and hugs the onion rings
                    if (id.startsWith('lettuce-top')) return 'mb-[-104px] sm:mb-[-124px]';
                    // Onions and pickles nestled into the tomato slice
                    if (id.startsWith('onion')) return 'mb-[-80px] sm:mb-[-94px]';
                    if (id.startsWith('pickle')) return 'mb-[-78px] sm:mb-[-92px]';
                    // Tomato pulled down even closer so it presses firmly into the melted cheese
                    if (id.startsWith('tomato')) return 'mb-[-98px] sm:mb-[-116px]';
                    // Cheese hugs patty surface directly
                    if (id.startsWith('cheese')) return 'mb-[-108px] sm:mb-[-126px]';
                    // Patty pulled down firmly so it presses directly into the bottom lettuce leaves
                    if (id.startsWith('patty')) return 'mb-[-116px] sm:mb-[-136px]';
                    // Bottom lettuce leaf pulled down firmly so it drapes and rests directly on the heel bun
                    if (id === 'lettuce') return 'mb-[-102px] sm:mb-[-120px]';
                    return 'mb-0';
                  };

                  const layerMargin = isExploded 
                    ? 'my-1 sm:my-1.5' 
                    : getStackedOffset(layer.id);

                  // Stack order: Top items sit on top of bottom items in eye-level perspective
                  const computedZIndex = isExploded ? (layers.length - index) : (layers.length - index + 10);

                  return (
                    <motion.div
                      key={layer.id}
                      layout
                      initial={{ opacity: 0, scale: 0.85, y: -25 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                      className={`relative w-full flex items-center justify-center transition-all ${layerMargin}`}
                      style={{ zIndex: computedZIndex }}
                    >
                      {/* Left Leader Line & Nutrition Callout */}
                      {isExploded && layer.align === 'left' && (
                        <div className="hidden sm:flex absolute left-0 items-center gap-2.5 w-44 text-left pointer-events-none">
                          <div>
                            <div className="text-base font-bold font-chunky text-amber-500 tracking-wide leading-tight">
                              {layer.category}
                            </div>
                            <div className="text-[11px] text-white/60 font-mono">
                              {layer.calories} kcal • {layer.dimension}
                            </div>
                          </div>
                          <div className="flex-1 flex items-center">
                            <span className="w-full h-[1px] bg-amber-500/40" />
                            <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                          </div>
                        </div>
                      )}

                      {/* Photo Asset with Custom Natural Layer Proportions */}
                      <motion.div 
                        whileHover={{ scale: 1.04 }}
                        className="relative z-10 flex items-center justify-center cursor-pointer group"
                      >
                        {(() => {
                          // Proportions matching real burger anatomy:
                          // - Top & bottom buns match in base width
                          // - Patty matches the bun size
                          // - Cheese and ruffled lettuce spread wider and drape over the edges
                          const getLayerWidth = (id) => {
                            if (id.startsWith('bun-top') || id === 'bun-bottom') {
                              return 'w-[290px] sm:w-[335px] max-w-[90%]';
                            }
                            if (id.startsWith('patty')) {
                              return 'w-[290px] sm:w-[335px] max-w-[90%]'; // same size as bun
                            }
                            if (id.startsWith('cheese')) {
                              return 'w-[320px] sm:w-[370px] max-w-[98%]'; // bigger than bun (draping corners)
                            }
                            if (id === 'lettuce-top') {
                              return 'w-[315px] sm:w-[365px] max-w-[96%]'; // prominent ruffled leaves spreading past bun
                            }
                            if (id === 'lettuce') {
                              return 'w-[325px] sm:w-[380px] max-w-[100%]'; // bottom leaves remain full size & ruffled
                            }
                            if (id.startsWith('tomato') || id.startsWith('onion') || id.startsWith('pickle')) {
                              return 'w-[280px] sm:w-[325px] max-w-[88%]';
                            }
                            return 'w-[290px] sm:w-[335px]';
                          };

                          // In assembled mode, subtle contact shadow (0.2); in exploded mode, soft floating depth (0.35)
                          const shadowStyle = isExploded 
                            ? 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]' 
                            : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]';

                          return (
                            <img 
                              src={layer.img} 
                              alt={layer.name}
                              className={`h-auto ${getLayerWidth(layer.id)} object-contain ${shadowStyle} filter group-hover:brightness-105 transition-all select-none`}
                              draggable={false}
                            />
                          );
                        })()}
                      </motion.div>

                      {/* Right Leader Line & Nutrition Callout */}
                      {isExploded && layer.align === 'right' && (
                        <div className="hidden sm:flex absolute right-0 items-center gap-2.5 w-44 text-right pointer-events-none">
                          <div className="flex-1 flex items-center justify-end">
                            <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                            <span className="w-full h-[1px] bg-amber-500/40" />
                          </div>
                          <div>
                            <div className="text-base font-bold font-chunky text-amber-500 tracking-wide leading-tight">
                              {layer.category}
                            </div>
                            <div className="text-[11px] text-white/60 font-mono">
                              {layer.calories} kcal • {layer.dimension}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom View Switcher Bar */}
          <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setViewMode('exploded')}
                className={`px-4 py-1.5 rounded-lg font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'exploded' 
                    ? 'bg-amber-500 text-black shadow-lg' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Exploded Anatomy
              </button>
              <button
                onClick={() => setViewMode('stacked')}
                className={`px-4 py-1.5 rounded-lg font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'stacked' 
                    ? 'bg-amber-500 text-black shadow-lg' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Assembled Burger
              </button>
            </div>

            <div className="text-xs font-mono text-white/40 hidden sm:block">
              {layers.length} Layers • 100% Fresh Ingredients
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANE: Real Ingredient Controls & Order Action      */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[40%] h-[45%] lg:h-full flex flex-col justify-between bg-surface/95 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Custom Burger Name Input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-amber-500/80 flex items-center gap-1 mb-1">
                <Sliders className="w-3.5 h-3.5" /> Burger Name
              </label>
              <input 
                type="text" 
                value={customBurgerName}
                onChange={(e) => setCustomBurgerName(e.target.value)}
                maxLength={40}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-bold focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="Give your burger a name..."
              />
            </div>

            {/* 1. Smashed Chicken Patty (Quantity Counter) */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Smashed Prime Patty</span>
                  <span className="text-xs text-amber-500 font-mono">+${(pattyCount * 3.50).toFixed(2)}</span>
                </h4>
                <p className="text-xs text-white/50">4oz chicken with crispy lace edges</p>
              </div>

              <div className="flex items-center gap-2 bg-surface px-2 py-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setPattyCount(Math.max(1, pattyCount - 1))}
                  disabled={pattyCount <= 1}
                  className="p-1 rounded text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-display font-bold text-sm text-white px-2">
                  {pattyCount}
                </span>
                <button 
                  onClick={() => setPattyCount(Math.min(3, pattyCount + 1))}
                  disabled={pattyCount >= 3}
                  className="p-1 rounded text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Melted Cheddar Cheese (Quantity Counter) */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Melted American Cheddar</span>
                  <span className="text-xs text-amber-500 font-mono">+${(cheeseCount * 1.00).toFixed(2)}</span>
                </h4>
                <p className="text-xs text-white/50">Warm, gooey draped cheddar</p>
              </div>

              <div className="flex items-center gap-2 bg-surface px-2 py-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setCheeseCount(Math.max(0, cheeseCount - 1))}
                  disabled={cheeseCount <= 0}
                  className="p-1 rounded text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-display font-bold text-sm text-white px-2">
                  {cheeseCount}
                </span>
                <button 
                  onClick={() => setCheeseCount(Math.min(3, cheeseCount + 1))}
                  disabled={cheeseCount >= 3}
                  className="p-1 rounded text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Tomato Toggle */}
            <div 
              onClick={() => setHasTomato(!hasTomato)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                hasTomato ? 'border-amber-500/60 bg-amber-500/10' : 'border-white/10 bg-black/40 opacity-70'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Vine Tomatoes</span>
                  <span className="text-xs text-amber-500 font-mono">+$0.75</span>
                </h4>
                <p className="text-xs text-white/50">Thick cut fresh tomato slices</p>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                hasTomato ? 'bg-amber-500 border-amber-500 text-black' : 'border-white/30'
              }`}>
                {hasTomato && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* 4. Onions Toggle */}
            <div 
              onClick={() => setHasOnion(!hasOnion)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                hasOnion ? 'border-amber-500/60 bg-amber-500/10' : 'border-white/10 bg-black/40 opacity-70'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Caramelized Onions</span>
                  <span className="text-xs text-amber-500 font-mono">+$0.60</span>
                </h4>
                <p className="text-xs text-white/50">Slow-cooked sweet onion rings</p>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                hasOnion ? 'bg-amber-500 border-amber-500 text-black' : 'border-white/30'
              }`}>
                {hasOnion && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* 5. Pickles Toggle */}
            <div 
              onClick={() => setHasPickles(!hasPickles)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                hasPickles ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-white/10 bg-black/40 opacity-70'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Crunchy Dill Pickles</span>
                  <span className="text-xs text-emerald-400 font-mono">+$0.50</span>
                </h4>
                <p className="text-xs text-white/50">Crinkle cut tangy house pickles</p>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                hasPickles ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-white/30'
              }`}>
                {hasPickles && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* 6. Crisp Green Lettuce Toggle */}
            <div 
              onClick={() => setHasLettuce(!hasLettuce)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                hasLettuce ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-white/10 bg-black/40 opacity-70'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Crisp Garden Leaves</span>
                  <span className="text-xs text-emerald-400 font-mono">+$0.50</span>
                </h4>
                <p className="text-xs text-white/50">Ruffled green iceberg leaf</p>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                hasLettuce ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-white/30'
              }`}>
                {hasLettuce && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

          </div>

          {/* Sticky Total & Order Action Bar */}
          <div className="p-5 bg-black/95 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-display font-bold text-amber-400">
                  ${totalPrice.toFixed(2)}
                </span>
                <span className="text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  🔥 {totalCalories} kcal
                </span>
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                {layers.length} Layers • Smashed fresh to order
              </p>
            </div>

            <button
              onClick={handleAddCustomToBag}
              disabled={isSuccessToast}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold tracking-wider uppercase text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
                isSuccessToast 
                  ? 'bg-emerald-500 text-black' 
                  : 'bg-amber-400 text-black hover:bg-amber-300'
              }`}
            >
              {isSuccessToast ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  Added to Smash Bag!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Add to Smash Bag
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BurgerCustomizer;
