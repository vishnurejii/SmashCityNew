import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check, ShoppingBag } from 'lucide-react';
import { menuApi } from '../services/api';
import { useCart } from '../context/CartContext';

// Default static fallback items mirroring original design
const initialBurgers = [
  {
    id: 1,
    name: 'The Classic Smash',
    type_label: 'Single Patty',
    type: 'Single Patty',
    image: '/burger-1.webp',
    description: 'Our signature 4oz chicken patty, American cheese, house pickles, and smash sauce on a potato bun.',
    desc: 'Our signature 4oz chicken patty, American cheese, house pickles, and smash sauce on a potato bun.',
    ingredients: ['Chicken', 'American Cheese', 'Pickles', 'Smash Sauce'],
    price: '$8.50',
    numericPrice: 8.5
  },
  {
    id: 2,
    name: 'The Double Trouble',
    type_label: 'Double Patty',
    type: 'Double Patty',
    image: '/burger-2.webp',
    description: 'Two smashed patties, double cheese, caramelized onions, and spicy mayo.',
    desc: 'Two smashed patties, double cheese, caramelized onions, and spicy mayo.',
    ingredients: ['Double Chicken', 'Double Cheese', 'Caramelized Onions', 'Spicy Mayo'],
    price: '$12.00',
    numericPrice: 12.0
  },
  {
    id: 3,
    name: 'The Inferno',
    type_label: 'Spicy Specialty',
    type: 'Spicy Specialty',
    image: '/burger-3.webp',
    description: 'Pepper jack, fresh jalapeños, crispy bacon, and our blazing habanero aioli.',
    desc: 'Pepper jack, fresh jalapeños, crispy bacon, and our blazing habanero aioli.',
    ingredients: ['Chicken', 'Pepper Jack', 'Jalapeños', 'Bacon', 'Habanero Aioli'],
    price: '$11.50',
    numericPrice: 11.5
  },
  {
    id: 4,
    name: 'The Truffle Mushroom',
    type_label: 'Premium',
    type: 'Premium',
    image: '/burger-4.webp',
    description: 'Swiss cheese, sautéed wild mushrooms, and rich truffle mayo.',
    desc: 'Swiss cheese, sautéed wild mushrooms, and rich truffle mayo.',
    ingredients: ['Chicken', 'Swiss Cheese', 'Mushrooms', 'Truffle Mayo'],
    price: '$13.00',
    numericPrice: 13.0
  }
];

const initialSides = [
  {
    id: 5,
    name: 'Crispy Fries',
    type_label: 'Side',
    type: 'Side',
    image: '/side-1.webp',
    description: 'Double-fried for maximum crunch, tossed in our signature seasoning.',
    desc: 'Double-fried for maximum crunch, tossed in our signature seasoning.',
    ingredients: ['Potato', 'Signature Seasoning'],
    price: '$4.00',
    numericPrice: 4.0
  },
  {
    id: 6,
    name: 'Loaded Smash Fries',
    type_label: 'Loaded Side',
    type: 'Loaded Side',
    image: '/side-2.webp',
    description: 'Fries topped with cheese sauce, caramelized onions, and chopped smash patty.',
    desc: 'Fries topped with cheese sauce, caramelized onions, and chopped smash patty.',
    ingredients: ['Fries', 'Cheese Sauce', 'Chicken', 'Onions'],
    price: '$7.50',
    numericPrice: 7.5
  }
];

const MenuItemCard = ({ item, isSide, cartItem, onAddToCart, onUpdateQty }) => {
  const formattedPrice = typeof item.price === 'string' && item.price.startsWith('$')
    ? item.price
    : `$${parseFloat(item.price || 0).toFixed(2)}`;

  const itemImage = item.effective_image_url || item.image || item.image_url || '/burger-1.webp';
  const itemType = item.type_label || item.type || 'Smash City Special';
  const itemDesc = item.description || item.desc || '';
  const ingredientsList = Array.isArray(item.ingredients) ? item.ingredients : [];

  return (
    <div className="group bg-gray-200 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col border border-gray-300">
      {/* Image Box */}
      <div className={`w-full ${isSide ? 'h-48' : 'h-56'} overflow-hidden relative`}>
        <img
          src={itemImage}
          alt={item.name}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ${item.is_available === false ? 'grayscale contrast-125' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-200 via-gray-200/20 to-transparent" />
        
        {item.is_available === false ? (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-red-600 text-white font-mono text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-400 shadow-xl">
              Sold Out
            </span>
          </div>
        ) : (
          <span className="absolute top-4 right-4 bg-accent text-black font-display px-4 py-1 text-2xl rounded shadow-lg">
            {formattedPrice}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6 pt-2 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-4xl font-['Caveat'] font-bold text-gray-900 tracking-wide">{item.name}</h4>
        </div>
        <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-3">{itemType}</p>
        <p className="text-gray-600 text-sm mb-4 flex-1 font-medium">{itemDesc}</p>

        {/* Ingredients */}
        {ingredientsList.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {ingredientsList.map((ing, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full uppercase tracking-wider border border-gray-200"
              >
                {ing}
              </span>
            ))}
          </div>
        )}

        {/* Add to Cart CTA */}
        <div className="pt-2 border-t border-gray-300/80">
          {item.is_available === false ? (
            <div className="w-full bg-gray-300/80 text-gray-600 text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-lg text-center cursor-not-allowed border border-gray-400/60 shadow-inner">
              Currently Unavailable
            </div>
          ) : cartItem ? (
            <div className="flex items-center justify-between bg-black text-white rounded-lg p-1.5 px-3 shadow-md">
              <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Check className="w-4 h-4 text-accent" /> Added ({cartItem.quantity})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQty(cartItem.id, cartItem.quantity - 1)}
                  className="w-7 h-7 bg-surface-hover hover:bg-accent hover:text-black rounded flex items-center justify-center transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-sm font-bold px-1 text-white">{cartItem.quantity}</span>
                <button
                  onClick={() => onUpdateQty(cartItem.id, cartItem.quantity + 1)}
                  className="w-7 h-7 bg-surface-hover hover:bg-accent hover:text-black rounded flex items-center justify-center transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              className="w-full bg-[#111] hover:bg-accent hover:text-black text-accent text-xs font-bold uppercase tracking-widest py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md group/btn"
            >
              <ShoppingBag className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
              <span>Add to Order</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Menu = () => {
  const { items: cartItems, addToCart, updateQuantity } = useCart();
  const [burgers, setBurgers] = useState(initialBurgers);
  const [sides, setSides] = useState(initialSides);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const products = await menuApi.getProducts();
        if (Array.isArray(products) && products.length > 0) {
          const bgList = products.filter(
            (p) => p.category_slug === 'burgers' || (!p.category_slug && !p.type_label?.toLowerCase().includes('side'))
          );
          const sdList = products.filter(
            (p) => p.category_slug === 'sides' || p.category_slug === 'sauces' || p.type_label?.toLowerCase().includes('side')
          );
          
          if (bgList.length > 0) setBurgers(bgList);
          if (sdList.length > 0) setSides(sdList);
        }
      } catch (err) {
        console.warn('Using baseline menu items (backend connecting):', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const getCartItemForProduct = (product) => {
    return cartItems.find((ci) => ci.product?.id === product.id || ci.product?.name === product.name);
  };

  return (
    <section id="menu" className="pb-24 pt-12 relative bg-[url('/menu-bg.webp')] bg-cover bg-center bg-fixed">
      {/* Dark Overlay for eye strain reduction */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Black Wavy Divider from Hook section above */}
      <div
        className="absolute top-0 left-0 w-full h-12 z-20 pointer-events-none"
        style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.1))' }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,0 L1440,0 L1440,40 C1080,90 720,-10 360,40 C180,65 0,40 0,40 Z" fill="#0A0A0A" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-display tracking-widest text-red-600 mb-4 drop-shadow-sm">
            THE MENU
          </h2>
          <p className="text-xl md:text-3xl font-['Caveat'] font-bold text-gray-300 tracking-wide">
            Fresh ingredients. Hot grills. No compromises.
          </p>
        </div>

        <div className="grid xl:grid-cols-3 gap-12 xl:gap-16">
          {/* Burgers */}
          <div className="xl:col-span-2">
            <h3 className="text-4xl font-display text-gray-100 tracking-widest uppercase mb-8 border-b-2 border-red-500/30 pb-4">
              Burgers
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {burgers.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  isSide={false}
                  cartItem={getCartItemForProduct(item)}
                  onAddToCart={addToCart}
                  onUpdateQty={updateQuantity}
                />
              ))}
            </div>
          </div>

          {/* Sides */}
          <div>
            <h3 className="text-4xl font-display text-gray-100 tracking-widest uppercase mb-8 border-b-2 border-red-500/30 pb-4">
              Sides & Extras
            </h3>
            <div className="space-y-8">
              {sides.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  isSide={true}
                  cartItem={getCartItemForProduct(item)}
                  onAddToCart={addToCart}
                  onUpdateQty={updateQuantity}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Menu;
