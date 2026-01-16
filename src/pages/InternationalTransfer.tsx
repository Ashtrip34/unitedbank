import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useBanking } from '@/hooks/useBanking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Globe, ArrowRight, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WORLD_CURRENCIES, getCurrencyByCode, type Currency } from '@/lib/currencies';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
}

export default function InternationalTransfer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { account, transfer } = useBanking();
  
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientIBAN, setRecipientIBAN] = useState('');
  const [recipientSwift, setRecipientSwift] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    calculateConversion();
  }, [amount, fromCurrency, toCurrency, rates]);

  // Auto-set recipient country based on currency
  useEffect(() => {
    const currency = getCurrencyByCode(toCurrency);
    if (currency && !recipientCountry) {
      setRecipientCountry(currency.country);
    }
  }, [toCurrency]);

  const fetchRates = async () => {
    const { data } = await supabase
      .from('exchange_rates')
      .select('*');
    
    if (data) {
      setRates(data as ExchangeRate[]);
    }
  };

  const calculateConversion = () => {
    const numAmount = parseFloat(amount) || 0;
    if (fromCurrency === toCurrency) {
      setConvertedAmount(numAmount);
      return;
    }
    
    const rate = rates.find(r => r.from_currency === fromCurrency && r.to_currency === toCurrency);
    if (rate) {
      setConvertedAmount(numAmount * rate.rate);
    } else {
      // Try reverse rate
      const reverseRate = rates.find(r => r.from_currency === toCurrency && r.to_currency === fromCurrency);
      if (reverseRate) {
        setConvertedAmount(numAmount / reverseRate.rate);
      } else {
        // Try USD as intermediary
        const toUsd = rates.find(r => r.from_currency === fromCurrency && r.to_currency === 'USD');
        const fromUsd = rates.find(r => r.from_currency === 'USD' && r.to_currency === toCurrency);
        if (toUsd && fromUsd) {
          setConvertedAmount(numAmount * toUsd.rate * fromUsd.rate);
        } else if (fromCurrency === 'USD' && fromUsd) {
          setConvertedAmount(numAmount * fromUsd.rate);
        }
      }
    }
  };

  const getCurrentRate = () => {
    if (fromCurrency === toCurrency) return 1;
    const rate = rates.find(r => r.from_currency === fromCurrency && r.to_currency === toCurrency);
    if (rate) return rate.rate;
    const reverseRate = rates.find(r => r.from_currency === toCurrency && r.to_currency === fromCurrency);
    if (reverseRate) return 1 / reverseRate.rate;
    // Try USD as intermediary
    if (fromCurrency === 'USD') {
      const fromUsd = rates.find(r => r.from_currency === 'USD' && r.to_currency === toCurrency);
      if (fromUsd) return fromUsd.rate;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    if (!recipientIBAN || !recipientSwift) {
      toast({ title: 'Please fill in all recipient details', variant: 'destructive' });
      return;
    }

    if (!recipientCountry) {
      toast({ title: 'Please select recipient country', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    // Use the transfer function with international details
    const { error } = await transfer(
      numAmount,
      recipientName,
      recipientIBAN,
      recipientSwift,
      recipientBank,
      `International Transfer to ${recipientCountry} (${toCurrency}): ${description}`
    );

    setLoading(false);

    if (error) {
      toast({ title: 'Transfer failed', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const fromCurrencyData = getCurrencyByCode(fromCurrency);
  const toCurrencyData = getCurrencyByCode(toCurrency);

  // Get unique countries from currencies
  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(WORLD_CURRENCIES.map(c => c.country))];
    return uniqueCountries.sort();
  }, []);

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">International Transfer Initiated!</h1>
          <p className="text-muted-foreground mb-2">{formatCurrency(parseFloat(amount), fromCurrency)} sent to {recipientName}</p>
          <p className="text-sm text-muted-foreground mb-2">Destination: {recipientCountry}</p>
          <p className="text-sm text-muted-foreground mb-6">Recipient will receive approximately {formatCurrency(convertedAmount, toCurrency)}</p>
          <Button variant="accent" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">International Transfer</h1>
        </div>
      </header>

      <div className="container py-8 max-w-md">
        <Card variant="elevated">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Globe className="w-6 h-6 text-accent" />
            </div>
            <CardTitle>Send Money Worldwide</CardTitle>
            <CardDescription>Transfer funds to any country in the world</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Currency Converter */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Popover open={fromOpen} onOpenChange={setFromOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {fromCurrencyData?.flag} {fromCurrency}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[250px]" align="start">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {WORLD_CURRENCIES.map((curr) => (
                              <CommandItem
                                key={curr.code}
                                value={`${curr.code} ${curr.name} ${curr.country}`}
                                onSelect={() => {
                                  setFromCurrency(curr.code);
                                  setFromOpen(false);
                                }}
                              >
                                <span className="mr-2">{curr.flag}</span>
                                <span className="font-medium">{curr.code}</span>
                                <span className="ml-2 text-muted-foreground text-sm">{curr.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground mt-4" />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Popover open={toOpen} onOpenChange={setToOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {toCurrencyData?.flag} {toCurrency}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[250px]" align="start">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {WORLD_CURRENCIES.map((curr) => (
                              <CommandItem
                                key={curr.code}
                                value={`${curr.code} ${curr.name} ${curr.country}`}
                                onSelect={() => {
                                  setToCurrency(curr.code);
                                  setToOpen(false);
                                }}
                              >
                                <span className="mr-2">{curr.flag}</span>
                                <span className="font-medium">{curr.code}</span>
                                <span className="ml-2 text-muted-foreground text-sm">{curr.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Exchange Rate
                </span>
                <span className="font-medium">
                  1 {fromCurrency} = {getCurrentRate().toFixed(4)} {toCurrency}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount ({fromCurrency})</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {fromCurrencyData?.symbol}
                  </span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="pl-8" 
                    min="0" 
                    step="0.01" 
                  />
                </div>
                {parseFloat(amount) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Recipient receives: <span className="font-medium text-foreground">{formatCurrency(convertedAmount, toCurrency)}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Available: {formatCurrency(Number(account?.balance || 0), 'USD')}</p>
              </div>

              {/* Recipient Country */}
              <div className="space-y-2">
                <Label>Recipient Country</Label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {recipientCountry || 'Select country...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-full" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {countries.map((country) => {
                            const curr = WORLD_CURRENCIES.find(c => c.country === country);
                            return (
                              <CommandItem
                                key={country}
                                value={country}
                                onSelect={() => {
                                  setRecipientCountry(country);
                                  setCountryOpen(false);
                                }}
                              >
                                <span className="mr-2">{curr?.flag}</span>
                                {country}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Recipient Name</Label>
                <Input 
                  placeholder="Full legal name" 
                  value={recipientName} 
                  onChange={(e) => setRecipientName(e.target.value)} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input 
                  placeholder="Street address, city, postal code" 
                  value={recipientAddress} 
                  onChange={(e) => setRecipientAddress(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>IBAN / Account Number</Label>
                <Input 
                  placeholder="e.g., GB82 WEST 1234 5698 7654 32" 
                  value={recipientIBAN} 
                  onChange={(e) => setRecipientIBAN(e.target.value.toUpperCase())} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>SWIFT / BIC Code</Label>
                <Input 
                  placeholder="e.g., DEUTDEFF" 
                  value={recipientSwift} 
                  onChange={(e) => setRecipientSwift(e.target.value.toUpperCase())} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input 
                  placeholder="Recipient's bank" 
                  value={recipientBank} 
                  onChange={(e) => setRecipientBank(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Reference / Purpose</Label>
                <Input 
                  placeholder="e.g., Invoice payment" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transfer Fee</span>
                  <span>$25.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Delivery</span>
                  <span>1-3 business days</span>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="accent" 
                size="lg" 
                className="w-full" 
                disabled={loading || !recipientName || !recipientIBAN || !recipientSwift || !amount || !recipientCountry}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                ) : (
                  'Send International Transfer'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
