import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export function Button({ variant = "default", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: Record<string, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 text-gray-900 hover:bg-gray-50",
    ghost: "text-gray-900 hover:bg-gray-100",
  };
  const classes = `${base} ${variants[variant]} ${className}`.trim();
  return <button className={classes} {...props} />;
}


