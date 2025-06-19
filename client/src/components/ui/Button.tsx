import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
  to?: string;
}

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/25',
  secondary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary/25',
  outline: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 focus:ring-primary/25',
  ghost: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-primary/25',
};

const sizeStyles = {
  sm: 'text-xs px-3 py-1.5 rounded',
  md: 'text-sm px-4 py-2 rounded',
  lg: 'text-base px-6 py-2.5 rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className = '',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      href,
      to,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none';
    const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
    
    const content = (
      <>
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </>
    );
    
    if (to) {
      return (
        <Link to={to} className={styles}>
          {content}
        </Link>
      );
    }
    
    if (href) {
      return (
        <a href={href} className={styles} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    
    return (
      <button ref={ref} className={styles} disabled={disabled || isLoading} {...props}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
