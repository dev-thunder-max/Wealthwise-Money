import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useApp } from '../AppContext';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function SmartInsights() {
  const { transactions, accounts, budgets, categories } = useApp();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const dataSummary = {
        totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
        recentTransactions: transactions.slice(0, 10).map(t => ({
          amount: t.amount,
          type: t.type,
          category: t.category_name,
          date: t.date
        })),
        budgets: budgets.map(b => ({
          category: b.category_name,
          limit: b.limit_amount
        }))
      };

      const prompt = `You are a world-class financial advisor. Analyze this user's financial data and provide 3-4 concise, actionable insights or advice. 
      Focus on spending patterns, budget adherence, and savings opportunities.
      
      Data: ${JSON.stringify(dataSummary)}
      
      Format the response in clean Markdown. Be encouraging but professional.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Using flash for speed
        contents: [{ parts: [{ text: prompt }] }],
      });

      setInsight(response.text || "No insights available at the moment.");
    } catch (error) {
      console.error("AI Insight Error:", error);
      setInsight("Failed to generate insights. Please check your API key or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Smart Insights</h2>
        </div>
        <button
          onClick={generateInsight}
          disabled={loading}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </button>
      </div>

      {insight ? (
        <div className="prose prose-slate prose-sm max-w-none">
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm mb-4">Get personalized AI advice based on your spending patterns.</p>
          <button
            onClick={generateInsight}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Generate Insights
          </button>
        </div>
      )}
    </div>
  );
}
