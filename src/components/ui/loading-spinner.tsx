
import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" 
           role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
