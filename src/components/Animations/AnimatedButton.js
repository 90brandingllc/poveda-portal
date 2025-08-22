import React from 'react';
import { motion } from 'framer-motion';

const AnimatedButton = ({ 
  children, 
  className = '',
  variant = 'bounce',
  ...props 
}) => {
  const buttonVariants = {
    bounce: {
      hover: {
        scale: 1.05,
        transition: {
          duration: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }
      },
      tap: {
        scale: 0.95,
        transition: {
          duration: 0.1,
        }
      }
    },
    glow: {
      hover: {
        scale: 1.02,
        boxShadow: "0 0 25px rgba(25, 118, 210, 0.6)",
        transition: {
          duration: 0.3,
        }
      },
      tap: {
        scale: 0.98,
      }
    },
    float: {
      hover: {
        y: -3,
        transition: {
          duration: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }
      },
      tap: {
        y: 0,
      }
    }
  };

  return (
    <motion.div
      className={className}
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants[variant]}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedButton;
