import { useState, useEffect, useMemo } from 'react';
import { X, Download, Trash2, Filter, Clock, AlertCircle, Info, AlertTriangle, Skull } from 'lucide-react';
import { logger, LogLevel, type LogEntry, type LogLevelType } from '../services/logger';

interface DevDashboardProps {
  onClose: () => void;
}

type FilterType = 'all' | LogLevelType;

export function DevDashboard({ onClose }: DevDashboardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  // Subscribe to log updates
  useEffect(() => {
    const updateLogs = () => setLogs(logger.getLogs());
    updateLogs();
    return logger.subscribe(updateLogs);
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => filter === 'all' || log.level === filter)
      .filter(log => 
        searchTerm === '' || 
        log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase())
      )
      .reverse(); // Most recent first
  }, [logs, filter, searchTerm]);

  // Summary stats
  const stats = useMemo(() => {
    const summary = logger.generateSummary();
    return {
      total: summary.totalEvents,
      errors: summary.errors,
      warnings: summary.warnings,
      duration: Math.round(summary.sessionDuration / 1000),
    };
  }, [logs]);

  // Storage usage
  const storage = useMemo(() => {
    const usage = logger.getStorageUsage();
    return {
      used: (usage.used / 1024).toFixed(1),
      percent: ((usage.used / usage.max) * 100).toFixed(1),
    };
  }, [logs]);

  const handleExport = () => {
    logger.downloadLogs();
  };

  const handleClear = () => {
    if (confirm('Clear all logs? This cannot be undone.')) {
      logger.clearLogs();
    }
  };

  const getLevelIcon = (level: LogLevelType) => {
    switch (level) {
      case LogLevel.INFO:
        return <Info className="w-4 h-4 text-blue-400" />;
      case LogLevel.WARN:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case LogLevel.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case LogLevel.FATAL:
        return <Skull className="w-4 h-4 text-red-600" />;
    }
  };

  const getLevelColor = (level: LogLevelType) => {
    switch (level) {
      case LogLevel.INFO:
        return 'text-blue-400 border-blue-400/30';
      case LogLevel.WARN:
        return 'text-yellow-400 border-yellow-400/30';
      case LogLevel.ERROR:
        return 'text-red-400 border-red-400/30';
      case LogLevel.FATAL:
        return 'text-red-600 border-red-600/30 bg-red-900/20';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    return `+${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900/95 text-gray-100 z-50 flex flex-col font-mono text-sm overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-green-400">Developer Dashboard</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              Session: {logger.getSessionId().slice(-8)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Events</p>
            <p className="text-xl font-bold text-green-400">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500">Errors</p>
            <p className="text-xl font-bold text-red-400">{stats.errors}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500">Warnings</p>
            <p className="text-xl font-bold text-yellow-400">{stats.warnings}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500">Session Time</p>
            <p className="text-xl font-bold text-blue-400">{stats.duration}s</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            {(['all', LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  filter === f
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />

          {/* Actions */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* Storage indicator */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <span>Storage: {storage.used}KB ({storage.percent}%)</span>
          <div className="flex-1 h-1 bg-gray-700 rounded overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${storage.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchTerm || filter !== 'all' ? 'No matching logs' : 'No logs yet'}
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${getLevelColor(log.level)} ${
                expandedLog === index ? 'bg-gray-800' : 'hover:bg-gray-800/50'
              }`}
              onClick={() => setExpandedLog(expandedLog === index ? null : index)}
            >
              {/* Log header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getLevelIcon(log.level)}
                  <span className="font-semibold">{log.event}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(log.timestamp)}
                  </span>
                  <span>{formatDuration(log.sessionDuration)}</span>
                </div>
              </div>

              {/* Expanded content */}
              {expandedLog === index && (
                <div className="mt-3 space-y-3">
                  {/* Data */}
                  {Object.keys(log.data).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data:</p>
                      <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {log.error && (
                    <div>
                      <p className="text-xs text-red-500 mb-1">Error:</p>
                      <pre className="text-xs bg-red-900/30 text-red-300 p-2 rounded overflow-auto max-h-40">
                        {log.error.message}
                        {log.error.stack && `\n\n${log.error.stack}`}
                      </pre>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 flex gap-4">
                    <span>Session: {log.sessionId.slice(-8)}</span>
                    <span>URL: {log.url}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 border-t border-gray-700 p-2 text-center text-xs text-gray-500">
        Press <kbd className="px-1 py-0.5 bg-gray-700 rounded">Ctrl+Shift+D</kbd> or <kbd className="px-1 py-0.5 bg-gray-700 rounded">Esc</kbd> to close
      </div>
    </div>
  );
}
