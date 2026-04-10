import { useState, useEffect, useRef } from 'react';
import { Search, X, User, Building2, Calendar, FileText, ArrowRight, Command } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  role?: string;
  url: string;
}

const typeIcons: Record<string, any> = {
  user: User,
  provider: Building2,
  booking: Calendar,
  quote: FileText,
};

const typeColors: Record<string, string> = {
  user: 'bg-rose-500/20 text-rose-400',
  provider: 'bg-emerald-500/20 text-emerald-400',
  booking: 'bg-cyan-500/20 text-cyan-400',
  quote: 'bg-pink-500/20 text-pink-400',
};

export default function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminAPI.globalSearch(query);
        setResults(res.data.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onClose();
    setQuery('');
    setResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск клиентов, мастеров, заказов, заявок..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
            <span>ESC</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-400 mt-2 text-sm">Поиск...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type] || FileText;
                const colorClass = typeColors[result.type] || 'bg-slate-600 text-slate-300';
                
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex ? 'bg-slate-700' : 'hover:bg-slate-750'
                    }`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">{result.title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${colorClass}`}>
                          {result.type}
                        </span>
                        {result.status && (
                          <span className="px-2 py-0.5 bg-slate-600 rounded text-xs text-slate-300">
                            {result.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 truncate">{result.subtitle}</p>
                    </div>
                    {index === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">Ничего не найдено</p>
              <p className="text-slate-500 text-sm mt-1">Попробуйте другой запрос</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Command className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">Начните вводить для поиска</p>
              <p className="text-slate-500 text-sm mt-1">
                ID, email, телефон, название...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑↓</kbd>
              навигация
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Enter</kbd>
              выбрать
            </span>
          </div>
          <span>{results.length} результатов</span>
        </div>
      </div>
    </div>
  );
}
