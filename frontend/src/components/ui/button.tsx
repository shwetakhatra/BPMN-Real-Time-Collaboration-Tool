import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, SizeProp } from "@fortawesome/fontawesome-svg-core";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "gray" | "ghost" | "icon";
  icon?: IconDefinition;
  iconSize?: SizeProp;
  iconSpin?: boolean;
  loading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  secondary: "bg-purple-500 text-white hover:bg-purple-600",
  danger: "bg-red-500 text-white hover:bg-red-600",
  gray: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  ghost: "bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700",
  icon: "bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  icon,
  iconSize = "lg",
  iconSpin = false,
  loading = false,
  loadingText,
  children,
  className = "",
  disabled,
  fullWidth = false,
  ...props
}) => {
  const isIconOnly = variant === "icon" || (!children && icon);
  const baseStyles = isIconOnly 
    ? "flex items-center justify-center p-1 rounded-md transition-colors" 
    : "flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors whitespace-nowrap";
  const variantStyle = variantStyles[variant];
  const disabledStyle = (disabled || loading) ? "opacity-50 cursor-not-allowed" : "";
  const widthStyle = fullWidth ? "w-full" : "";
  
  const combinedClassName = `${baseStyles} ${variantStyle} ${disabledStyle} ${widthStyle} ${className}`.trim();

  const content = loading && loadingText ? loadingText : children;
  const isContentString = typeof content === "string";
  const needsWrapper = !isIconOnly && isContentString;

  return (
    <button
      className={combinedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {icon && (
        <FontAwesomeIcon 
          icon={icon} 
          size={iconSize} 
          className={`${iconSpin || loading ? "animate-spin " : ""}${!isIconOnly ? "mt-1" : ""}`}
        />
      )}
      {content && needsWrapper ? (
        <span className="font-bold">{content}</span>
      ) : (
        content
      )}
    </button>
  );
};

export default Button;
