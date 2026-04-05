import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      const input = inputRef.current || (ref as any)?.current;
      if (!input) return;

      // Apply styles on mount and whenever value changes
      const applyStyles = () => {
        // Force override autofill immediately
        const style = input.style;
        style.boxShadow = '0 0 0 1000px hsl(222 50% 15%) inset !important';
        style.color = '#ffffff !important';
        style.WebkitTextFillColor = '#ffffff !important';
        style.caretColor = '#ffffff !important';
      };

      applyStyles();

      // Apply styles on input change
      const handleInput = () => applyStyles();
      const handleChange = () => applyStyles();
      const handleAutofill = () => {
        setTimeout(applyStyles, 0);
        setTimeout(applyStyles, 10);
        setTimeout(applyStyles, 50);
      };

      input.addEventListener('input', handleInput);
      input.addEventListener('change', handleChange);
      input.addEventListener('autofill', handleAutofill);

      // Handle WebKit autofill animation
      const handleAnimationStart = (e: AnimationEvent) => {
        if ((e as any).animationName === 'autofill' || (e as any).animationName === '-webkit-autofill') {
          applyStyles();
        }
      };

      input.addEventListener('animationstart', handleAnimationStart);
      input.addEventListener('webkitAnimationStart', handleAnimationStart);

      return () => {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('change', handleChange);
        input.removeEventListener('autofill', handleAutofill);
        input.removeEventListener('animationstart', handleAnimationStart);
        input.removeEventListener('webkitAnimationStart', handleAnimationStart);
      };
    }, [ref]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-950 text-white",
          className,
        )}
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as any).current = node;
          }
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
