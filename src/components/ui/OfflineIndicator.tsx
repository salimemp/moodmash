import { useTranslation } from '@/utils/i18n/hooks';
import { useNetworkStatus } from '@/utils/networkStatus';
import { Wifi, WifiOff } from 'lucide-react';
import React from 'react';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const { isOnline, connectionInfo } = useNetworkStatus();
  const { t } = useTranslation('common');
  
  // If online, don't show anything
  if (isOnline && !connectionInfo.saveData) {
    return null;
  }
  
  // For poor connection (online but slow)
  const isPoorConnection = isOnline && 
    (connectionInfo.effectiveType === 'slow-2g' || 
     connectionInfo.effectiveType === '2g' ||
     (connectionInfo.downlink !== undefined && connectionInfo.downlink < 0.5));
  
  if (isPoorConnection) {
    return (
      <div className={`fixed top-0 right-0 m-4 p-2 bg-yellow-500 text-white rounded-md shadow-md flex items-center gap-2 ${className}`}>
        <Wifi size={16} />
        <span className="text-sm">{t('offline.slow_connection')}</span>
      </div>
    );
  }
  
  // For data-saving mode
  if (isOnline && connectionInfo.saveData) {
    return (
      <div className={`fixed top-0 right-0 m-4 p-2 bg-blue-500 text-white rounded-md shadow-md flex items-center gap-2 ${className}`}>
        <Wifi size={16} />
        <span className="text-sm">{t('offline.data_saver_enabled')}</span>
      </div>
    );
  }
  
  // Offline status
  return (
    <div className={`fixed top-0 right-0 m-4 p-2 bg-red-500 text-white rounded-md shadow-md flex items-center gap-2 ${className}`}>
      <WifiOff size={16} />
      <span className="text-sm">{t('offline.offline_mode')}</span>
    </div>
  );
}; 