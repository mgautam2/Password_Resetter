export type Status = 'idle' | 'running' | 'stuck' | 'success' | 'error';

export interface AgentState {
  status: Status;
  message?: string;
  password?: string;
  steps?: string[];
  milestones?: string[];
  connected?: boolean;
  gmailAuthorized?: boolean;
}

export type Action =
  | { type: 'navigate'; url: string }
  | { type: 'click';    selector: string }
  | { type: 'fill';     selector: string; value: string }
  | { type: 'read' };
