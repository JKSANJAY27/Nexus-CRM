export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
}

export interface Contact {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned';
  assigned_to?: string;
  deals_count?: number;
  total_deal_value?: number;
  created_at: string;
}

export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface Deal {
  id: string;
  tenant_id: string;
  contact_id: string;
  title: string;
  value: number;
  stage: DealStage;
  created_by: string;
  assigned_to?: string;
  expected_close?: string;
  contact_name?: string;
  contact_email?: string;
  contact_company?: string;
  assigned_to_name?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  tenant_id: string;
  deal_id?: string;
  contact_id?: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  notes?: string;
  created_by: string;
  created_by_name?: string;
  deal_title?: string;
  contact_name?: string;
  created_at: string;
}

export interface PipelineStageData {
  stage: DealStage;
  count: string;
  total_value: string;
}

export interface DashboardMetrics {
  total_contacts: number;
  total_deals: number;
  total_revenue: number;
  pipeline_value: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  pipeline_by_stage: PipelineStageData[];
  recent_activities: Activity[];
}
