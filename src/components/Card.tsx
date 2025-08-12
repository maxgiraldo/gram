interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
}) => {
  const baseStyles = 'bg-white rounded-lg shadow-md';
  
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = `${baseStyles} ${paddingStyles[padding]} ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
};