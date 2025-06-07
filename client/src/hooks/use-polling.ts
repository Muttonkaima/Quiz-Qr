import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function usePolling(queryKeys: string[], interval: number = 2000, enabled: boolean = true) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [queryClient, queryKeys, interval, enabled]);

  return {
    stop: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };
}
