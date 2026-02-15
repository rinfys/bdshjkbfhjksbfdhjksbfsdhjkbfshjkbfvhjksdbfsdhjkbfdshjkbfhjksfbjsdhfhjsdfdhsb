import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check, Lock } from 'lucide-react';

interface GuideOverlayProps {
    onComplete: () => void;
    active: boolean;
    teamName: string;
    logoUrl: string;
    onStepChange?: (step: number) => void;
}

const GuideOverlay: React.FC<GuideOverlayProps> = ({ onComplete, active, teamName, logoUrl, onStepChange }) => {
    const [step, setStep] = useState(0);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
    const requestRef = useRef<number>(0);

    const steps = [
        {
            targetId: 'team-header',
            title: 'Welcome to RWA Fantasy',
            text: "Ready to make a splash? Kick off your RWA career by giving your waterpolo team a legendary name and choosing an icon. You need a strong identity before diving into the pool!",
            position: 'bottom',
            requiresAction: true
        },
        {
            targetId: 'money-box',
            title: 'Manage Your Cap',
            text: 'You have a £100m salary cap to assemble your roster. Scout for elite RWA stars or find undervalued talent to build a balanced squad ready for matchday.',
            position: 'bottom',
            requiresAction: false
        },
        {
            targetId: 'pitch-container',
            title: 'Assemble Your 7',
            text: 'Click the "+" slots to sign players from the market. Whether you need a brick-wall GK or a lethal Hole Set, pick your starting 7 carefully. Drag players to swap positions!',
            position: 'top',
            requiresAction: false
        }
    ];

    const currentStep = steps[step];

    // Notify parent of step change
    useEffect(() => {
        if (active && onStepChange) {
            onStepChange(step);
        }
    }, [step, active, onStepChange]);

    // Logic to check if current step requirements are met
    const canProceed = () => {
        if (step === 0) {
            // Require Team Name change and Logo
            const nameChanged = teamName.trim().length > 0 && teamName !== "My Team";
            const logoSet = logoUrl && logoUrl.length > 0;
            return nameChanged && logoSet;
        }
        return true;
    };

    const updatePosition = () => {
        if (!currentStep?.targetId) return;
        const el = document.getElementById(currentStep.targetId);
        if (!el) return;

        const rect = el.getBoundingClientRect();

        // 1. Highlight Box (Fixed Position)
        // We add a little padding
        setHighlightStyle({
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            position: 'fixed',
            display: 'block'
        });

        // 2. Popover Position (Fixed Position)
        // Default to bottom center of target
        let top = rect.bottom + 20;
        // Center horizontally relative to target
        let left = rect.left + (rect.width / 2) - 224; // 224 is half of max-w-md (448px)

        // Boundaries
        const popoverHeight = 250; // Approx
        const popoverWidth = 448;
        const padding = 20;

        // Check if it fits below
        const fitsBelow = top + popoverHeight < window.innerHeight;
        const isTopPreferred = currentStep.position === 'top';

        // If top preferred or doesn't fit below, try top
        if ((isTopPreferred && rect.top > popoverHeight + padding) || !fitsBelow) {
            top = rect.top - popoverHeight - padding;
        }

        // Horizontal Checks
        if (left < padding) left = padding;
        if (left + popoverWidth > window.innerWidth - padding) left = window.innerWidth - popoverWidth - padding;

        setPopoverStyle({
            top: top,
            left: left,
            position: 'fixed'
        });
    };

    // Animation Loop to track element movement (scrolling, resizing, etc.)
    const tick = () => {
        if(active) {
            updatePosition();
            requestRef.current = requestAnimationFrame(tick);
        }
    };

    useEffect(() => {
        if (active) {
            // Scroll target into view once on step change
            const el = document.getElementById(currentStep.targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            requestRef.current = requestAnimationFrame(tick);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [step, active]);

    if (!active) return null;

    const handleNext = () => {
        if (!canProceed()) return;

        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] w-full h-full pointer-events-none">

            {/* Highlighter Ring */}
            <div
                className="border-4 border-fpl-green rounded-xl shadow-[0_0_50px_rgba(0,255,135,0.5)] transition-all duration-100 z-[201] animate-pulse pointer-events-none"
                style={highlightStyle}
            />

            {/* Content Card */}
            <div
                className="bg-[#29002d] border border-white/20 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 z-[202] pointer-events-auto flex flex-col"
                style={popoverStyle}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-fpl-green font-bold uppercase tracking-widest text-xs mb-1">RWA FANTASY GUIDE</h3>
                        <div className="bg-white/10 text-white px-2 py-0.5 rounded text-[10px] inline-block font-mono">
                            Step {step + 1} / {steps.length}
                        </div>
                    </div>
                    <button onClick={onComplete} className="text-gray-500 hover:text-white text-xs underline">Skip Tour</button>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">{currentStep.title}</h2>
                <p className="text-gray-300 mb-6 leading-relaxed text-sm">{currentStep.text}</p>

                {/* Step 0 Warning */}
                {step === 0 && !canProceed() && (
                    <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg flex items-center gap-2 text-yellow-500 text-xs font-bold">
                        <Lock size={14} />
                        <span>Please change the team name and set a logo to continue.</span>
                    </div>
                )}

                <div className="flex justify-end mt-auto">
                    <button
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className={`font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg
                        ${canProceed()
                            ? 'bg-fpl-green hover:bg-white text-fpl-purple'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
                    `}
                    >
                        {step === steps.length - 1 ? 'Get Started' : 'Next'}
                        {step === steps.length - 1 ? <Check size={18} /> : <ArrowRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuideOverlay;