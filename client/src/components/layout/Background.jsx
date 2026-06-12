import React from 'react';

const Background = ({ children }) => {
  return (
    <div 
      className="relative h-screen w-full bg-[#050505] bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden flex flex-col font-sans text-white selection:bg-[#ff5a00] selection:text-white"
    >
      {/* Medium glass overlay over the background image */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-lg"></div>
      
      {/* App content sitting directly on the blurred background */}
      <div className="relative z-10 w-full h-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Background;
