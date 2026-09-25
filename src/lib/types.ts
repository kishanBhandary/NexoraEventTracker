export type Student = {
  id: number;
  usn: string;
  name: string;
  email?: string;
  branch?: string;
  semester?: string;
  totalEvents?: number;
  wins?: number;
  finalists?: number;
  participation?: number;
};

export type EventRecord = {
  id?: number;
  event_name?: string;
  event_type?: string;
  host_college?: string;
  event_date?: string;
  participants?: number;
  winners?: number;
};

export type DashboardSummary = {
  totalstudents?: number;
  totalstudents_?: number;
  totalStudents?: number;
  totalEvents?: number;
  totalParticipants?: number;
  winners?: number;
  certificatesPending?: number;
  certificatesVerified?: number;
};
