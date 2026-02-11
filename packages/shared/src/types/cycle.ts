export interface Quarter {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  reviewDeadline: string;
}

export type CycleStatus = 'planning' | 'active' | 'review' | 'closed';

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  quarters: Quarter[];
  status: CycleStatus;
}
