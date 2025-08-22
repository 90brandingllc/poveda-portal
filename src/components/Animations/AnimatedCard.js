import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  delay = 0, 
  hoverScale = 1.02,
  className = '',
  ...props 
}) => {
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    },
  };

  const hoverVariants = {
    hover: {
      scale: hoverScale,
      y: -8,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    }
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, amount: 0.3 }}
      variants={{ ...cardVariants, ...hoverVariants }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
