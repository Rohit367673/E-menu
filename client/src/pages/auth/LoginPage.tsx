import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/admin/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-5 relative overflow-hidden">
      {/* Floating orbs */}
      <motion.div
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [10, -15, 10] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 right-1/3 w-44 h-44 bg-secondary/8 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative"
      >
        <div
          className="rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/25"
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 32px 64px -16px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-accent mb-5 shadow-lg shadow-primary/30">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Welcome Back</h1>
            <p className="text-white/45 text-sm">Sign in to manage your digital menu</p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-white/60 mb-2">
                Email Address
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                className="!bg-white/[0.08] !border-white/10 !text-white placeholder:!text-white/25 focus:!border-primary-light focus:!bg-white/[0.12]"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-white/60 mb-2">
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                className="!bg-white/[0.08] !border-white/10 !text-white placeholder:!text-white/25 focus:!border-primary-light focus:!bg-white/[0.12]"
              />
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-6"
              size="lg"
              id="login-submit-btn"
            >
              Sign In
            </Button>
          </motion.form>

          {/* Footer branding */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center text-white/20 text-xs mt-8"
          >
            E-Menu Admin Panel
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
