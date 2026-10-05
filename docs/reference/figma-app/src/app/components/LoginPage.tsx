import { useState, FormEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Simulate login - en producción aquí validarías las credenciales
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#424242] via-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <h1 
            className="text-white text-4xl mb-2 tracking-wider" 
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.15em' }}
          >
            THE CHARTER
          </h1>
          <p className="text-[#F68B1F] text-sm tracking-wide uppercase">
            Mapping the New World
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl text-[#424242] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Access Platform
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in with your institutional credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm text-[#424242] mb-2 tracking-wide"
              >
                Institutional Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E64626] focus:border-transparent"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm text-[#424242] mb-2 tracking-wide"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E64626] focus:border-transparent"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-[#E64626] focus:ring-[#E64626]"
                  defaultChecked
                />
                Remember me
              </label>
              <button 
                type="button"
                className="text-[#E64626] hover:text-[#F68B1F] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 bg-[#E64626] hover:bg-[#F68B1F] text-white rounded-lg transition-all duration-200 uppercase tracking-wider shadow-lg hover:shadow-xl"
            >
              Explore
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button className="text-[#E64626] hover:text-[#F68B1F] transition-colors">
                Request Access
              </button>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-2 text-center text-sm text-gray-400">
          <p>© 2024 The Charter. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}