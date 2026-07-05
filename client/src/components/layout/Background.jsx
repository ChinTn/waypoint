import React from 'react';

const Background = ({ children }) => {
  return (
    <div 
      className="relative h-screen w-full bg-[#f4f7fa] dark:bg-neutral-950 overflow-hidden flex flex-col font-sans text-neutral-900 dark:text-white transition-colors duration-200"
    >
      {/* Light gradient blob for light mode */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100 dark:bg-transparent blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-50 dark:bg-transparent blur-[120px] pointer-events-none"></div>

      {/* App content sitting directly on the background */}
      <div className="relative z-10 w-full h-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Background;
