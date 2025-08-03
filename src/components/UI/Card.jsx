const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-4 bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;