import React from 'react';
import { loginUser } from '../firebase';
import { ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
    const handleLogin = async () => {
        try {
            await loginUser();
        } catch (error: any) {
            console.error("Login failed", error);
            if (error.code === 'auth/unauthorized-domain') {
                alert("Login Failed: Domain Not Authorized.");
            } else {
                alert("Login failed: " + error.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0041C7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#3ACBE8] rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#1CA3DE] rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-md w-full bg-[#0160C9] border border-white/10 rounded-2xl shadow-2xl p-8 relative z-10 text-center">

                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center transform rotate-3 shadow-lg shadow-[#3ACBE8]/20 bg-white/5 overflow-hidden border-2 border-white/10">
                        <img src="https://i.imgur.com/AZYKczg.png" alt="RWA Fantasy" className="w-full h-full object-cover" />
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2">RWA Fantasy</h1>
                <p className="text-gray-300 mb-8">Sign in to manage your team, make transfers, and compete in the league.</p>

                <button
                    onClick={handleLogin}
                    className="w-full bg-white hover:bg-gray-100 text-[#0041C7] font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-xl"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Sign in with Google
                    <ArrowRight size={18} className="ml-auto opacity-50"/>
                </button>

                <div className="mt-8 pt-6 border-t border-white/5 text-xs text-gray-400">
                    By signing in, you agree to play fair and have fun.
                    <br/>Powered by Realtime Database.
                </div>
            </div>
        </div>
    );
};

export default Login;