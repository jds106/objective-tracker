import type { Objective } from './objective.js';

/** Node owner summary — minimal user info for display in cascade views */
export interface CascadeNodeOwner {
  id: string;
  displayName: string;
  jobTitle: string;
  level: number;
  avatarUrl?: string;
}

/** A single node in the cascade tree, containing an objective, its owner, and children */
export interface CascadeNode {
  objective: Objective;
  owner: CascadeNodeOwner;
  children: CascadeNode[];
}
