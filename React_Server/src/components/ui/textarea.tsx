import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const textarea = textareaRef.current || (ref as any)?.current;
    if (!textarea) return;

    const applyStyles = () => {
      const style = textarea.style;
      style.boxShadow = '0 0 0 1000px hsl(222 50% 15%) inset !important';
      style.color = '#ffffff !important';
      style.WebkitTextFillColor = '#ffffff !important';
      style.caretColor = '#ffffff !important';
    };

    applyStyles();

    const handleInput = () => applyStyles();
    const handleChange = () => applyStyles();
    const handleAnimationStart = (e: AnimationEvent) => {
      if ((e as any).animationName === 'autofill' || (e as any).animationName === '-webkit-autofill') {
        applyStyles();
      }
    };

    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('change', handleChange);
    textarea.addEventListener('animationstart', handleAnimationStart);
    textarea.addEventListener('webkitAnimationStart', handleAnimationStart);

    return () => {
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('change', handleChange);
      textarea.removeEventListener('animationstart', handleAnimationStart);
      textarea.removeEventListener('webkitAnimationStart', handleAnimationStart);
    };
  }, [ref]);

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-950 text-white",
        className,
      )}
      ref={(node) => {
        textareaRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as any).current = node;
        }
      }}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
