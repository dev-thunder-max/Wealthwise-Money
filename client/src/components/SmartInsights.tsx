import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useGenerateInsights } from "@/hooks/use-insights";

export function SmartInsights() {
  const { mutate: generate, data, isPending, error } = useGenerateInsights();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-primary to-purple-600 p-1">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
      
      <div className="relative h-full bg-black/10 backdrop-blur-sm rounded-xl p-6 text-white border border-white/10 shadow-inner">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5 text-indigo-50" />
            </div>
            <h2 className="text-xl font-display font-semibold text-white">AI Financial Advisor</h2>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => generate()} 
            disabled={isPending}
            className="bg-white/10 hover:bg-white/20 text-white border-0 shadow-none font-medium rounded-lg"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {data ? 'Refresh Advice' : 'Analyze Finances'}
          </Button>
        </div>

        <div className="min-h-[120px] flex flex-col justify-center">
          {error ? (
            <div className="flex items-start gap-3 bg-red-500/20 text-red-100 p-4 rounded-xl border border-red-500/30">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error.message}</p>
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center justify-center text-indigo-100/70 py-6 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <p className="animate-pulse text-sm">Analyzing your spending patterns...</p>
            </div>
          ) : data ? (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-display prose-a:text-indigo-200">
              <ReactMarkdown>{data.insight}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-indigo-100/80 mb-4 text-sm max-w-md mx-auto">
                Get personalized, AI-driven advice based on your current accounts, budgets, and recent spending.
              </p>
              <Button 
                onClick={() => generate()} 
                className="bg-white text-primary hover:bg-indigo-50 font-semibold shadow-lg shadow-black/10 rounded-xl px-6"
              >
                Generate Insights Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
