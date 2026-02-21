import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase handles the callback automatically via onAuthStateChange
        // We just need to wait briefly and redirect
        const timer = setTimeout(() => {
            navigate('/dashboard', { replace: true });
        }, 1500);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#1E2535] border-t-[#00D084] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#F1F5F9] text-lg font-semibold">Signing you in...</p>
                <p className="text-[#94A3B8] text-sm mt-1">Please wait while we set up your account</p>
            </div>
        </div>
    );
}
