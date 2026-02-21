import { useState, useEffect } from 'react';
import type { User, Objective } from '@objective-tracker/shared';
import * as usersApi from '../services/users.api.js';

export interface ReportData {
  user: User;
  objectives: Objective[];
}

export function useTeamData(reports: User[], cycleId?: string) {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reports.length === 0) {
      setReportData([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.allSettled(
      reports.map(report =>
        usersApi.getUserObjectives(report.id, cycleId).then(({ data }) => ({
          user: report,
          objectives: data,
        }))
      )
    ).then(results => {
      if (cancelled) return;

      const data: ReportData[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          data.push(result.value);
        }
      }
      setReportData(data);
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [reports, cycleId]);

  return { reportData, isLoading, error };
}
