import React, { useRef } from 'react';
import { useStore } from '../store/useStore';

export function ScrollingText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { language } = useStore();

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap relative flex-1 max-w-full ${className}`}
    >
      <div
        ref={textRef}
        className="inline-block whitespace-nowrap transition-transform duration-[2500ms] ease-linear"
        onMouseEnter={(e) => {
          if (containerRef.current && textRef.current) {
            const overflowAmount = textRef.current.scrollWidth - containerRef.current.clientWidth;
            if (overflowAmount > 0) {
              const finalAmount = overflowAmount + 8;
              const direction = language === 'ar' ? 1 : -1;
              e.currentTarget.style.transform = `translateX(${finalAmount * direction}px)`;
            }
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
