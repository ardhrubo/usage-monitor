import React, { useState, useEffect } from 'react';
import { getDailySummary } from '@renderer/services/api';
import { formatDuration, formatTimePercentage, getCategory } from '@renderer/utils/format';

const Dashboard = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const data = await getDailySummary(today.getTime());
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!summary) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  const { totalAppTime, totalWebTime, totalTime, appBreakdown, webBreakdown } = summary;

  const appEntries = Object.entries(appBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const webEntries = Object.entries(webBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm">Total App Time</h3>
          <p className="text-3xl font-bold text-white">{formatDuration(totalAppTime)}</p>
          <p className={`text-sm mt-2 ${getCategory(totalAppTime) === 'high' ? 'text-red-500' : 'text-green-500'}`}>
            {getCategory(totalAppTime)} usage
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm">Total Web Time</h3>
          <p className="text-3xl font-bold text-white">{formatDuration(totalWebTime)}</p>
          <p className={`text-sm mt-2 ${getCategory(totalWebTime) === 'high' ? 'text-red-500' : 'text-green-500'}`}>
            {getCategory(totalWebTime)} usage
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm">Total Time</h3>
          <p className="text-3xl font-bold text-white">{formatDuration(totalTime)}</p>
          <p className="text-sm text-gray-400 mt-2">
            {formatTimePercentage(totalAppTime, totalTime)} apps, {formatTimePercentage(totalWebTime, totalTime)} websites
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Apps</h3>
          <ul className="space-y-2">
            {appEntries.map(([name, time]) => (
              <li key={name} className="flex items-center justify-between">
                <span className="text-gray-300">{name}</span>
                <span className="text-gray-400">{formatDuration(time)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Websites</h3>
          <ul className="space-y-2">
            {webEntries.map(([name, time]) => (
              <li key={name} className="flex items-center justify-between">
                <span className="text-gray-300 truncate">{name}</span>
                <span className="text-gray-400">{formatDuration(time)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
