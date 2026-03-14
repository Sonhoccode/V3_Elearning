import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import Input from "../components/ui/Input"; 
import Button from "../components/ui/Button";
import { decodeTokenPayload } from "../utils/jwt";



// Admin Shield Icon
const ShieldIcon = ({ className }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, error, isLoading, user } = useAuthStore();
  
  const from = location.state?.from?.pathname || "/";
  const storedToken = localStorage.getItem("access_token");
  const tokenPayload = storedToken ? decodeTokenPayload(storedToken) : null;
  const role = user?.role || tokenPayload?.role;

  useEffect(() => {
    if (isAuthenticated && role === "admin") {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, role, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setErrorMsg("Please use a Gmail address");
      return;
    }
    
    const success = await login(email, password);
    if (!success) {
        // Store handle error, but we ensure UI updates
    } else {
        navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-t from-blue-100 to-blue-300 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
                <ShieldIcon className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Admin Portal
            </h2>
            <p className="text-slate-500 text-sm mt-2">
                Sign in to manage the platform
            </p>
        </div>

        {/* Error Messages */}
        {(error || errorMsg) && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{error || errorMsg}</span>
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 ml-1">Gmail</label>
                <div className="relative">
                    <Input 
                        type="email" 
                        placeholder="name@gmail.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border-gray-300 text-slate-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg pl-3 py-2.5 shadow-sm"
                    />
                </div>
            </div>
            
            <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 ml-1">Password</label>
                <div className="relative">
                        <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border-gray-300 text-slate-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg pl-3 py-2.5 shadow-sm"
                    />
                </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
                <Button 
                    type="submit" 
                    fullWidth 
                    disabled={isLoading}
                    className="w-36 bg-blue-600 hover:bg-blue-700 text-white font-medium mx-auto py-2.5 rounded-lg shadow-sm transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign In
                        </>
                    )}
                </Button>
            </div>
        </form>
        
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-slate-400 text-xs">
                &copy; {new Date().getFullYear()} Your Company. All rights reserved.
            </p>
        </div>
      </div>
    </div>
  );
}
