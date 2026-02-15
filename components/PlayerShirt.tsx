import React from 'react';

const DEFAULT_LOGO_URL = "https://i.imgur.com/AZYKczg.png";

interface PlayerShirtProps {
    color: 'red' | 'blue' | 'sky' | 'green' | 'yellow' | 'purple' | 'claret';
    imageUrl?: string;
}

const PlayerShirt: React.FC<PlayerShirtProps> = ({ color, imageUrl }) => {
    return (
        <div className="w-12 h-12 flex items-center justify-center filter drop-shadow-lg transform transition-transform hover:scale-110">
            <img
                src={imageUrl || DEFAULT_LOGO_URL}
                alt="Team Logo"
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.3))' }}
            />
        </div>
    );
};

export default PlayerShirt;