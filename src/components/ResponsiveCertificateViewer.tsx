import { useEffect, useRef, useState, type RefObject } from 'react';
import { CertificateDocument, CertificateData } from './CertificateDocument';

interface ResponsiveCertificateViewerProps {
  data: CertificateData;
  certRef?: RefObject<HTMLDivElement | null>;
  isDownloading?: boolean;
  maxScale?: number;
  fitMode?: 'contain' | 'width';
}

export function ResponsiveCertificateViewer({ 
  data, 
  certRef, 
  isDownloading = false,
  maxScale = 1,
  fitMode = 'contain'
}: ResponsiveCertificateViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.65);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      if (containerWidth <= 0) return;

      // Natural Certificate dimensions: 1000px width × 707px height
      // Keep safety margin for borders and outer shadow
      const hMargin = containerWidth < 480 ? 12 : containerWidth < 768 ? 20 : 32;
      const availableWidth = Math.max(containerWidth - hMargin, 200);
      const scaleX = availableWidth / 1000;

      let targetScale = scaleX;

      if (fitMode === 'contain') {
        // Measure parent viewport height to ensure the certificate fits completely from top to bottom
        let availableHeight: number;
        if (containerHeight > 180) {
          const vMargin = containerHeight < 500 ? 12 : 20;
          availableHeight = Math.max(containerHeight - vMargin, 150);
        } else {
          // Fallback to window viewport with safety margin
          availableHeight = Math.max(window.innerHeight * 0.65, 200);
        }

        const scaleY = availableHeight / 707;
        // Take the minimum of scaleX and scaleY so the certificate NEVER overflows either vertically or horizontally
        targetScale = Math.min(scaleX, scaleY);
      }
      
      // Bound scale between 0.22 (smallest mobile) and maxScale (default 1)
      targetScale = Math.min(Math.max(targetScale, 0.22), maxScale);
      
      setScale(targetScale);
      setIsReady(true);
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', calculateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [maxScale, fitMode]);

  const scaledWidth = Math.round(1000 * scale);
  const scaledHeight = Math.round(707 * scale);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex-1 flex items-center justify-center p-1 sm:p-2 select-none overflow-hidden"
    >
      <div 
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'width 0.15s ease-out, height 0.15s ease-out',
          opacity: isReady ? 1 : 0
        }}
        className="rounded-xl shadow-2xl border border-slate-300/80 bg-white shrink-0"
      >
        <div
          style={{
            width: '1000px',
            height: '707px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <CertificateDocument 
            data={data} 
            certRef={certRef} 
            isDownloading={isDownloading} 
          />
        </div>
      </div>
    </div>
  );
}
