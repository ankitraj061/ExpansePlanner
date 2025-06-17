import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Define the insight interface to match backend response
interface Insight {
  type: 'info' | 'warning' | 'positive' | 'neutral' | 'alert';
  message: string;
}

interface InsightsResponse {
  insights: Insight[];
  summary?: {
    totalMonths: number;
    totalTransactions: number;
    dateRange?: {
      earliest: string;
      latest: string;
    };
  };
  success?: boolean;
}

const InsightsModal = ({ forceShow = false }: { forceShow?: boolean }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get icon and colors based on insight type
  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'from-amber-500/10 to-amber-600/20 dark:from-amber-400/10 dark:to-amber-500/20',
          borderColor: 'border-amber-400/30',
          iconBg: 'bg-amber-500',
          textColor: 'text-amber-800 dark:text-amber-200'
        };
      case 'positive':
        return {
          icon: '✅',
          bgColor: 'from-green-500/10 to-green-600/20 dark:from-green-400/10 dark:to-green-500/20',
          borderColor: 'border-green-400/30',
          iconBg: 'bg-green-500',
          textColor: 'text-green-800 dark:text-green-200'
        };
      case 'alert':
        return {
          icon: '🚨',
          bgColor: 'from-red-500/10 to-red-600/20 dark:from-red-400/10 dark:to-red-500/20',
          borderColor: 'border-red-400/30',
          iconBg: 'bg-red-500',
          textColor: 'text-red-800 dark:text-red-200'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'from-blue-500/10 to-blue-600/20 dark:from-blue-400/10 dark:to-blue-500/20',
          borderColor: 'border-blue-400/30',
          iconBg: 'bg-blue-500',
          textColor: 'text-blue-800 dark:text-blue-200'
        };
      default: // neutral
        return {
          icon: '📊',
          bgColor: 'from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20',
          borderColor: 'border-primary/20',
          iconBg: 'bg-primary',
          textColor: 'text-foreground'
        };
    }
  };

  useEffect(() => {
    const checkAndShowModal = () => {
      // Check if modal was already shown today (unless forced)
      const lastShownDate = localStorage.getItem('insightsModalLastShown');
      const today = new Date().toDateString();
      
      if (!forceShow && lastShownDate === today) {
        // Already shown today, don't show again
        return;
      }

      // Fetch insights and show modal
      const fetchInsights = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const res = await axios.get<InsightsResponse>(
            `${import.meta.env.VITE_API_BASE_URL}/api/insights`, 
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          
          // Handle both old format (string array) and new format (object array)
          if (Array.isArray(res.data.insights)) {
            const processedInsights: Insight[] = res.data.insights.map(insight => {
              // If it's already an object with type and message, use it
              if (typeof insight === 'object' && 'message' in insight) {
                return insight as Insight;
              }
              // If it's a string (old format), convert it
              return {
                type: 'neutral' as const,
                message: insight as string
              };
            });
            setInsights(processedInsights);
          } else {
            // Fallback for unexpected format
            setInsights([{
              type: 'info',
              message: 'Unable to load insights at this time.'
            }]);
          }
        } catch (err: any) {
          console.error("Failed to fetch insights", err);
          
          // Handle specific error cases
          if (err.response?.status === 401) {
            setError('Please log in again to view insights.');
          } else if (err.response?.status === 500) {
            setError('Server error. Please try again later.');
          } else {
            setError('Failed to load insights. Please check your connection.');
          }
          
          // Set fallback insights
          setInsights([{
            type: 'info',
            message: 'Unable to load insights at this time. Please try again later.'
          }]);
        } finally {
          setIsLoading(false);
        }
      };

      // Fetch data immediately
      fetchInsights();

      // Show modal after 5 seconds
      const timer = setTimeout(() => {
        setShowModal(true);
        // Mark as shown today
        localStorage.setItem('insightsModalLastShown', today);
      }, 5000);

      return timer;
    };

    const timer = checkAndShowModal();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [forceShow]);

  const handleClose = () => {
    setShowModal(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!showModal) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className="bg-background border border-border rounded-2xl shadow-2xl p-8 w-full max-w-lg relative transform transition-all duration-300 ease-out scale-100 animate-in fade-in slide-in-from-bottom-4">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors duration-200"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-primary-foreground text-xl shadow-lg">
              💡
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Smart Insights</h2>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Analyzing your spending...</span>
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-center">No insights available yet.</p>
              <p className="text-sm text-muted-foreground/80 mt-1">Add more expenses to get personalized insights!</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {insights.map((insight, index) => {
                  const style = getInsightStyle(insight.type);
                  return (
                    <div 
                      key={index} 
                      className={`flex items-start gap-3 p-4 bg-gradient-to-r ${style.bgColor} rounded-xl border ${style.borderColor} hover:shadow-lg hover:border-opacity-50 transition-all duration-200`}
                    >
                      <div className={`w-8 h-8 ${style.iconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white shadow-sm`}>
                        <span className="text-sm">{style.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`${style.textColor} leading-relaxed text-sm font-medium`}>
                          {insight.message}
                        </p>
                        {insight.type && (
                          <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${style.iconBg} text-white capitalize opacity-80`}>
                            {insight.type}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Insights update daily
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground)) hsl(var(--background));
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground));
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--foreground));
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-in-from-bottom-4 {
          from {
            transform: translateY(16px);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: fade-in 0.3s ease-out, slide-in-from-bottom-4 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InsightsModal;