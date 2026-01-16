import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, TrendingUp, TrendingDown, Minus, CreditCard, AlertCircle, CheckCircle, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getCreditTips, getScoreRating, type CreditTip } from '@/lib/creditTips';

interface CreditScore {
  id: string;
  user_id: string;
  score: number;
  score_date: string;
  factors: string[];
  created_at: string;
}

export default function CreditScore() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [creditScores, setCreditScores] = useState<CreditScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCreditScores();
    }
  }, [user]);

  const fetchCreditScores = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('credit_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('score_date', { ascending: true });
    
    if (data) {
      setCreditScores(data.map(score => ({
        ...score,
        factors: Array.isArray(score.factors) ? score.factors as string[] : []
      })));
    }
    setLoading(false);
  };

  const latestScore = creditScores.length > 0 ? creditScores[creditScores.length - 1] : null;
  const previousScore = creditScores.length > 1 ? creditScores[creditScores.length - 2] : null;
  const scoreDiff = latestScore && previousScore ? latestScore.score - previousScore.score : 0;

  const scoreRating = latestScore ? getScoreRating(latestScore.score) : null;
  const tips = latestScore ? getCreditTips(latestScore.score) : [];

  const scorePercentage = latestScore ? ((latestScore.score - 300) / 550) * 100 : 0;

  const chartData = creditScores.map(score => ({
    date: new Date(score.score_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: score.score,
  }));

  const getTipIcon = (iconType: CreditTip['icon']) => {
    switch (iconType) {
      case 'payment': return <CreditCard className="h-5 w-5" />;
      case 'utilization': return <Target className="h-5 w-5" />;
      case 'monitor': return <AlertCircle className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-primary-foreground hover:bg-primary/80">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Credit Score</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {latestScore ? (
          <>
            {/* Main Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Your Credit Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${scoreRating?.color}`}>
                    {latestScore.score}
                  </div>
                  <div className={`text-xl font-medium mt-2 ${scoreRating?.color}`}>
                    {scoreRating?.label}
                  </div>
                  {scoreDiff !== 0 && (
                    <div className={`flex items-center justify-center gap-1 mt-2 ${scoreDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {scoreDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="text-sm font-medium">
                        {scoreDiff > 0 ? '+' : ''}{scoreDiff} points
                      </span>
                    </div>
                  )}
                  {scoreDiff === 0 && previousScore && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-muted-foreground">
                      <Minus className="h-4 w-4" />
                      <span className="text-sm">No change</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated: {new Date(latestScore.score_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>300</span>
                    <span>850</span>
                  </div>
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${scoreRating?.bgColor} transition-all duration-500`}
                      style={{ width: `${scorePercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Poor</span>
                    <span>Fair</span>
                    <span>Good</span>
                    <span>Very Good</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score History Chart */}
            {chartData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Score History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          domain={[300, 850]} 
                          tick={{ fontSize: 12 }} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => value.toString()}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <ReferenceLine y={670} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                        <ReferenceLine y={750} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Dashed lines indicate Good (670) and Very Good (750) thresholds
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Credit Improvement Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Personalized Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tips.map((tip, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-4 p-4 rounded-lg border ${
                        tip.priority === 'high' ? 'border-destructive/50 bg-destructive/5' :
                        tip.priority === 'medium' ? 'border-yellow-500/50 bg-yellow-500/5' :
                        'border-border bg-muted/30'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        tip.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                        tip.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {getTipIcon(tip.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{tip.title}</h4>
                          {tip.priority === 'high' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                              High Priority
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Score Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Score Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestScore.factors && latestScore.factors.length > 0 ? (
                  <ul className="space-y-3">
                    {latestScore.factors.map((factor, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No specific factors available at this time.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Score Ranges Reference */}
            <Card>
              <CardHeader>
                <CardTitle>Score Ranges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                    <span className="font-medium text-green-600">Excellent</span>
                    <span className="text-muted-foreground">800 - 850</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-400/10">
                    <span className="font-medium text-green-500">Very Good</span>
                    <span className="text-muted-foreground">750 - 799</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10">
                    <span className="font-medium text-blue-500">Good</span>
                    <span className="text-muted-foreground">670 - 749</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-500/10">
                    <span className="font-medium text-yellow-600">Fair</span>
                    <span className="text-muted-foreground">580 - 669</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-red-500/10">
                    <span className="font-medium text-red-500">Poor</span>
                    <span className="text-muted-foreground">300 - 579</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">No Credit Score Available</h3>
              <p className="text-muted-foreground">
                Your credit score data will appear here once it's available.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
