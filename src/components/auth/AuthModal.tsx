'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
          >
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <LoginForm
                mode={mode}
                onSuccess={handleSuccess}
                onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
