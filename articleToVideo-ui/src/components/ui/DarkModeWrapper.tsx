import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { isDarkMode, fixInputFields, applyDarkModeToElement } from "../../utils/themeUtils";

interface DarkModeWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * A wrapper component that ensures its children properly receive dark mode styling
 * Use this for any dynamically loaded content or components that need explicit dark mode
 */
export default function DarkModeWrapper({ children, className = "" }: DarkModeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCurrentlyDark = isDarkMode();
  
  // Apply dark mode to all children elements when they mount or dark mode changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Apply dark mode to the container itself
    applyDarkModeToElement(container);
    
    // Apply dark mode to all inputs within the container
    container.querySelectorAll('input, textarea, select').forEach(input => {
      if (input instanceof HTMLElement) {
        applyDarkModeToElement(input);
      }
    });
    
    // Fix all input fields
    fixInputFields();
  }, [isCurrentlyDark]);
  
  // Use basic classes to ensure content visibility regardless of theme
  const wrapperClass = isCurrentlyDark 
    ? 'dark-theme bg-gray-900 text-white' 
    : 'light-theme bg-gray-50 text-gray-900';
  
  return (
    <div 
      ref={containerRef} 
      data-dark-mode={isCurrentlyDark ? "true" : "false"}
      className={`${wrapperClass} ${className}`}
      style={{
        minHeight: '100vh',
        width: '100%',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
} 