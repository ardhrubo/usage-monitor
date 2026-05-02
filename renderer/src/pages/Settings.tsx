import React, { useState } from 'react';
import { exportToCSV } from '@renderer/services/api';

const Settings = () => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const csv = await exportToCSV();
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Data Export</h3>
          <p className="text-gray-400 mb-4">
            Export all usage data to a CSV file for analysis in spreadsheet software.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Data Retention</h3>
          <p className="text-gray-400 mb-4">
            Usage data is stored locally on your machine and is not sent to any external servers.
          </p>
          <p className="text-gray-500 text-sm">
            Data will be kept until you manually clear it or uninstall the application.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">About</h3>
          <p className="text-gray-400">Usage Monitor v1.0.0</p>
          <p className="text-gray-500 mt-2">
            An open-source tool for tracking app and website usage to improve productivity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
