import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export function ScrollingText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const { language } = useStore();

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    
    checkOverflow();
    const timeoutId = setTimeout(checkOverflow, 100);
    
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children, language]);

  return (
    <div 
      ref={containerRef} 
      className={`overflow-hidden whitespace-nowrap relative flex-1 max-w-full ${className}`}
    >
      <div 
        ref={textRef}
        className={`inline-block whitespace-nowrap transition-transform duration-[3000ms] ease-linear`}
        onMouseEnter={(e) => {
          if (isOverflowing && containerRef.current && textRef.current) {
            const overflowAmount = textRef.current.scrollWidth - containerRef.current.clientWidth;
            // Add a little extra padding so the last letter isn't cut off tightly
            const finalAmount = overflowAmount + 8;
            const direction = language === 'ar' ? 1 : -1;
            e.currentTarget.style.transform = `translateX(${finalAmount * direction}px)`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        {children}
      </div>
    </div>
  );
}
