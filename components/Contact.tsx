import React from 'react';
import { Mail, MessageSquare } from 'lucide-react';

const Contact: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-white py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-16 max-w-2xl">
                <h1 className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-fpl-green via-white to-fpl-blue">Get in Touch</h1>
                <p className="text-gray-400 text-lg">Have questions, feedback, or need support? Reach out to the developers or our staff!</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Email Card */}
                <div className="group bg-[#29002d]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-fpl-green/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(0,255,135,0.1)] flex flex-col items-center text-center">
                    <div className="p-4 bg-fpl-green/10 rounded-2xl text-fpl-green mb-6 group-hover:scale-110 transition-transform">
                        <Mail size={32} />
                    </div>
                    <h3 className="font-bold text-2xl mb-2">Email Support</h3>
                    <p className="text-gray-400 mb-6">For general inquiries, account support, and partnership offers.</p>
                    <a href="mailto:rwafullinquiries@gmail.com
" className="px-6 py-3 bg-white/5 rounded-xl text-fpl-green font-bold hover:bg-fpl-green hover:text-fpl-purple transition-all w-full">
                        rwafullinquiries@gmail.com

                    </a>
                </div>

                {/* Discord Card */}
                <div className="group bg-[#29002d]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] flex flex-col items-center text-center">
                    <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="font-bold text-2xl mb-2">Community Discord</h3>
                    <p className="text-gray-400 mb-6">Be notified about new updates and announcements.</p>
                    <a href="https://discord.gg/nWxJZN7e45" className="px-6 py-3 bg-white/5 rounded-xl text-blue-400 font-bold hover:bg-blue-500 hover:text-white transition-all w-full">
                        Join Discord Server
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Contact;