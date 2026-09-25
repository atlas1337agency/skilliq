import { FaWolfPackBattalion } from 'react-icons/fa';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface WolfLogoProps {
  className?: string;
  size?: number;
}

export function WolfLogo({ className, size }: WolfLogoProps) {
  const inlineStyle = size ? { width: size, height: size } : undefined;
  
  return (
    <div className={cn("relative flex items-center justify-center w-full h-full", className)} style={inlineStyle}>
      {/* Glitch Layers */}
      <motion.div
        className="absolute inset-0 text-cyan-500 flex items-center justify-center w-full h-full [&>svg]:w-full [&>svg]:h-full"
        animate={{
          x: [0, -4, 4, -2, 0, 0, 0, 0, 0, 0],
          y: [0, 2, -2, 1, 0, 0, 0, 0, 0, 0],
          opacity: [0, 0.8, 0.8, 0.8, 0, 0, 0, 0, 0, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "linear",
        }}
      >
        <FaWolfPackBattalion {...(size ? { size } : {})} />
      </motion.div>
      
      <motion.div
        className="absolute inset-0 text-fuchsia-500 flex items-center justify-center w-full h-full [&>svg]:w-full [&>svg]:h-full"
        animate={{
          x: [0, 4, -4, 2, 0, 0, 0, 0, 0, 0],
          y: [0, -2, 2, -1, 0, 0, 0, 0, 0, 0],
          opacity: [0, 0.8, 0.8, 0.8, 0, 0, 0, 0, 0, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "linear",
          delay: 0.1
        }}
      >
        <FaWolfPackBattalion {...(size ? { size } : {})} />
      </motion.div>

      {/* Main Logo */}
      <div className="relative z-10 text-black dark:text-foreground flex items-center justify-center w-full h-full [&>svg]:w-full [&>svg]:h-full">
        <FaWolfPackBattalion {...(size ? { size } : {})} />
      </div>
    </div>
  );
}
