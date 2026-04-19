import React from 'react';

const MusicPlayer: React.FC = () => {
  return (
    <div className="relative w-full h-[85vh] max-h-[900px] overflow-hidden rounded-[40px] border border-white/10 flex flex-col bg-[#0D0D0D]/70 backdrop-blur-[40px] shadow-2xl">
      <iframe
        src="https://monochrome.tf/"
        className="w-full h-full border-none"
        title="Music Player"
        allow="autoplay; encrypted-media"
      />
    </div>
  );
};

export default MusicPlayer;
