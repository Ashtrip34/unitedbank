import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff, ArrowRight, ArrowLeft, Building2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import unitedBankLogo from '@/assets/united-bank-logo.png';

const businessSignupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.string().min(1, 'Please select a business type'),
  ein: z.string().optional(),
  businessAddress: z.string().min(5, 'Business address is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const businessTypes = [
  'Sole Proprietorship',
  'Partnership',
  'LLC',
  'Corporation',
  'S Corporation',
  'Non-Profit',
  'Other',
];

export default function BusinessSignup() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [ein, setEin] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateStep = (stepNum: number) => {
    try {
      if (stepNum === 1) {
        z.object({
          fullName: z.string().min(2, 'Name must be at least 2 characters'),
          email: z.string().email('Please enter a valid email address'),
          password: z.string().min(8, 'Password must be at least 8 characters'),
          confirmPassword: z.string(),
        }).refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        }).parse({ fullName, email, password, confirmPassword });
      } else if (stepNum === 2) {
        z.object({
          businessName: z.string().min(2, 'Business name is required'),
          businessType: z.string().min(1, 'Please select a business type'),
          businessAddress: z.string().min(5, 'Business address is required'),
        }).parse({ businessName, businessType, businessAddress });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;
    
    setLoading(true);

    try {
      // First, create the user account
      const { error: signUpError } = await signUp(email, password, fullName);
      
      if (signUpError) {
        toast({
          title: "Sign up failed",
          description: signUpError.message,
          variant: "destructive",
        });
        return;
      }

      // Wait a moment for the trigger to create the account
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update account to business category
        await supabase
          .from('accounts')
          .update({ 
            category: 'business',
            tier: 'plus',
            transfer_limit: 500000
          })
          .eq('user_id', user.id);

        // Create business profile
        await supabase
          .from('business_profiles')
          .insert({
            user_id: user.id,
            business_name: businessName,
            business_type: businessType,
            ein: ein || null,
            business_address: businessAddress,
            verification_status: 'pending',
          });

        toast({
          title: "Business account created!",
          description: "Welcome to United Bank Business. Your account is pending verification.",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Business signup error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <img src={unitedBankLogo} alt="United Bank" className="w-14 h-14 object-contain" />
              <div>
                <span className="text-3xl font-bold block">United Bank</span>
                <span className="text-sm text-primary-foreground/70">Business Banking</span>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Banking built for<br />
              <span className="text-accent">your business</span>
            </h1>
            
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-md">
              Higher transfer limits, invoicing tools, and multi-user access designed for growing businesses.
            </p>
            
            <div className="space-y-4 text-primary-foreground/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-accent" />
                </div>
                <span>Up to $5M transfer limits</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-accent" />
                </div>
                <span>Multiple authorized users</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={unitedBankLogo} alt="United Bank" className="w-12 h-12 object-contain" />
            <div>
              <span className="text-2xl font-bold text-foreground block">United Bank</span>
              <span className="text-sm text-muted-foreground">Business</span>
            </div>
          </div>

          <Card variant="elevated" className="border-0">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={`w-12 h-1 rounded-full transition-colors ${
                        s <= step ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Step {step} of 2</span>
              </div>
              <CardTitle className="text-2xl font-bold">
                {step === 1 ? 'Account Details' : 'Business Information'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Create your business account credentials'
                  : 'Tell us about your business'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
                {step === 1 ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Your Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        error={!!errors.fullName}
                        disabled={loading}
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={!!errors.email}
                        disabled={loading}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          error={!!errors.password}
                          disabled={loading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={!!errors.confirmPassword}
                        disabled={loading}
                      />
                      {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        placeholder="Acme Inc."
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        error={!!errors.businessName}
                        disabled={loading}
                      />
                      {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select value={businessType} onValueChange={setBusinessType}>
                        <SelectTrigger className={errors.businessType ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.businessType && <p className="text-sm text-destructive">{errors.businessType}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ein">EIN (Optional)</Label>
                      <Input
                        id="ein"
                        placeholder="XX-XXXXXXX"
                        value={ein}
                        onChange={(e) => setEin(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">Required for verification</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessAddress">Business Address</Label>
                      <Input
                        id="businessAddress"
                        placeholder="123 Business St, City, State ZIP"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        error={!!errors.businessAddress}
                        disabled={loading}
                      />
                      {errors.businessAddress && <p className="text-sm text-destructive">{errors.businessAddress}</p>}
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      disabled={loading}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        {step === 2 ? 'Create Business Account' : 'Continue'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Need a personal account?{' '}
                  <Link to="/auth" className="text-accent font-medium hover:underline">
                    Sign up here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}