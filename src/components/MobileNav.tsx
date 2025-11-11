import { motion } from 'framer-motion';
import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'practice', label: 'Practice', icon: '🎸' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'tools', label: 'Tools', icon: '🎵' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export const MobileNav = () => {
  const [activeTab, setActiveTab] = useState('practice');

  const handleScrollTo = (id: string) => {
    setActiveTab(id);
    // Scroll to the section if it exists
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="glass-card rounded-t-3xl border-t border-white/10 shadow-glass px-2 py-3">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleScrollTo(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-primary text-white shadow-glow-primary'
                  : 'text-gray-400'
              }`}
            >
              <motion.span
                animate={{
                  scale: activeTab === item.id ? 1.2 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="text-2xl"
              >
                {item.icon}
              </motion.span>
              <span className={`text-xs font-medium ${activeTab === item.id ? 'text-white' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
