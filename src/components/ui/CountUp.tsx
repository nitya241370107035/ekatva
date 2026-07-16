import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';

interface CountUpProps {
  to: number;
  duration?: number; // in seconds
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  duration = 1.5,
  className = '',
  prefix = '',
  suffix = ''
}) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, { once: true, amount: 0.1 });

  useEffect(() => {
    if (!isInView) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCount(to);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing out quad
      const easedProgress = progress * (2 - progress);
      
      const currentValue = Math.floor(startValue + easedProgress * (to - startValue));
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, to, duration]);

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};
