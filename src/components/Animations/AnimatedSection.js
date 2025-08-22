import React from 'react';
import { motion } from 'framer-motion';

const AnimatedSection = ({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  direction = 'up',
  distance = 50,
  className = '',
  ...props 
}) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
      scale: direction === 'scale' ? 0.8 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
