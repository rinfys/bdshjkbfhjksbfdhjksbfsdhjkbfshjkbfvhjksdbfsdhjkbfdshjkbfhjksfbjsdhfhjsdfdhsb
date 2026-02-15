import React from 'react';

const About: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto text-white py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-fpl-green to-fpl-blue">About RWA Fantasy</h1>

            <div className="space-y-6 text-gray-300 leading-relaxed">
                <p>
                    Welcome to <strong>RWA Fantasy</strong>, the best waterpolo fantasy  website in the world. RWA Fantasy allows you to create your own dream team of the best RWA players,
                    compete against friends worldwide, and become the best.
                </p>

                <div className="bg-[#29002d] p-6 rounded-2xl border border-white/10 my-8">
                    <h2 className="text-xl font-bold text-white mb-4">How it works</h2>
                    <ul className="space-y-3 list-disc list-inside">
                        <li><strong className="text-fpl-green">Build your Squad:</strong> Select your best 5 starters and bench players within the £100m budget.</li>
                        <li><strong className="text-fpl-green">Points Scoring:</strong> Players earn points based on their RWA performance</li>
                        <li><strong className="text-fpl-green">Transfers:</strong> Make smart moves and don't fall behind.</li>
                        <li><strong className="text-fpl-green">Compete:</strong> Climb the Global Weekly and All-time leaderboards.</li>
                    </ul>
                </div>

                <p>
                    This project was developed by rinfy and the RWA Team as a fun way to give you guys a new way to engage with the league.
                </p>

                <div className="pt-8 border-t border-white/10 mt-8 text-sm text-gray-500">
                    Version 1.0.0 &bull; Built with React, Vite, Tailwind & Firebase.
                </div>
            </div>
        </div>
    );
};

export default About;