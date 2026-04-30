import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icons from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 11, 15, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--ink-700)',
              border: '1px solid var(--hair)',
              borderRadius: '8px',
              width: '100%',
              maxWidth: width,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            {title && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--hair)',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--pith)',
                  margin: 0,
                }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '4px',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    transition: 'color 150ms ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--pith)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
                >
                  <Icons.x size={16} />
                </button>
              </div>
            )}
            <div style={{ padding: '20px' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
