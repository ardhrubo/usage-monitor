import React, { useState, useEffect } from 'react';
import { getRecentUsage } from '@renderer/services/api';
import { formatDuration } from '@renderer/utils/format';

const Timeline = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await getRecentUsage(100);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
      <div className="space-y-4">
        {records.map((record) => (
          <div
            key={record.id}
            className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${record.type === 'app' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
              <div>
                <h3 className="text-gray-300 font-medium">{record.name}</h3>
                <p className="text-gray-500 text-sm">
                  {record.type === 'website' ? record.url : record.windowTitle || 'Unknown window'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{formatDuration(record.duration)}</p>
              <p className="text-gray-500 text-sm">
                {new Date(record.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
