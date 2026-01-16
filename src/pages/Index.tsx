import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Zap, CreditCard, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import unitedBankLogo from '@/assets/united-bank-logo.png';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="gradient-hero text-primary-foreground overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <nav className="container py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <img src={unitedBankLogo} alt="United Bank" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold">United Bank</span>
          </div>
          <Button variant="glass" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </nav>

        <div className="container py-20 md:py-32 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Modern banking for the <span className="text-accent">digital age</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Experience seamless money management with instant transfers, real-time tracking, and bank-level security. Your finances, simplified.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="accent" size="xl" asChild>
                <Link to="/auth">Get Started <ArrowRight className="w-5 h-5" /></Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/auth">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
      </header>

      {/* Features */}
      <section className="container py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why choose United Bank?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to manage your money, all in one place.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Bank-Level Security', desc: 'Your money is protected with enterprise-grade encryption and fraud monitoring.' },
            { icon: Zap, title: 'Instant Transfers', desc: 'Send money to anyone, anywhere, in seconds. No waiting, no hassle.' },
            { icon: CreditCard, title: 'Easy Management', desc: 'Track spending, set budgets, and manage your accounts from one dashboard.' },
          ].map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="gradient-primary rounded-3xl p-12 md:p-16 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">Join thousands who trust United Bank for their everyday banking needs.</p>
          <Button variant="accent" size="xl" asChild>
            <Link to="/auth">Create Free Account <ArrowRight className="w-5 h-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={unitedBankLogo} alt="United Bank" className="w-5 h-5 object-contain" />
            <span>© 2025 United Bank. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <p>FDIC Insured | Equal Housing Lender</p>
            <span className="text-xs">Built by <span className="font-semibold text-primary">Bluephes Technology</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
