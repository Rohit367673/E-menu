import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, UtensilsCrossed, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'owner' | 'manager'>('owner');
  const [email, setEmail] = useState('owner@sukoon.com');
  const [password, setPassword] = useState('owner123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (role: 'owner' | 'manager') => {
    setSelectedRole(role);
    if (role === 'owner') {
      setEmail('owner@sukoon.com');
      setPassword('owner123');
    } else {
      setEmail('manager@sukoon.com');
      setPassword('manager123');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success(selectedRole === 'owner' ? 'Welcome, Sukoon Owner!' : 'Welcome, Store Manager!');
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
        className="w-full max-w-[460px] relative"
      >
        <div
          className="rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/25"
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
            className="text-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-accent mb-3.5 shadow-lg shadow-primary/30">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">
              Sukoon Cafe & Bar
            </h1>
            <p className="text-white/50 text-xs">Select your login portal to continue</p>
          </motion.div>

          {/* Role Switcher Tabs */}
          <div className="flex rounded-2xl bg-white/10 p-1 mb-5 border border-white/10">
            <button
              type="button"
              onClick={() => handleSelectRole('owner')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'owner'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>👑 Sukoon Owner</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('manager')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'manager'
                  ? 'bg-blue-500 text-white shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>👔 Store Manager</span>
            </button>
          </div>

          {/* Role description pill */}
          <div
            className={`p-2.5 rounded-xl border text-[11px] mb-5 leading-tight flex items-start gap-2 ${
              selectedRole === 'owner'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
            }`}
          >
            <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-white/10 flex-shrink-0">
              {selectedRole === 'owner' ? 'Owner Portal' : 'Manager Portal'}
            </span>
            <span>
              {selectedRole === 'owner'
                ? 'Confidential Monthly Earnings Explorer, Dish Sales Analytics & Menu Control'
                : 'Live Tableside Orders, Kitchen Flow, Walk-in POS & Visual Table Map'}
            </span>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-white/70 mb-1.5">
                {selectedRole === 'owner' ? 'Owner Email' : 'Manager Email'}
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder={selectedRole === 'owner' ? 'owner@sukoon.com' : 'manager@sukoon.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                className="!bg-white/[0.08] !border-white/10 !text-white placeholder:!text-white/25 focus:!border-primary-light focus:!bg-white/[0.12]"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-white/70 mb-1.5">
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
              className={`w-full mt-4 !font-bold ${
                selectedRole === 'owner' ? '!bg-amber-500 hover:!bg-amber-600 !text-stone-950' : '!bg-blue-600 hover:!bg-blue-700'
              }`}
              size="lg"
              id="login-submit-btn"
            >
              Sign In as {selectedRole === 'owner' ? 'Owner' : 'Manager'}
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
