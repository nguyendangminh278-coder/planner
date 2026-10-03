import { loadClassFeed } from './classFeed';

// A separate read-only source; no Firebase tokens or personal planner records are sent here.
const url = import.meta.env.VITE_CLASS_SUPABASE_URL || 'https://dafylvuvlknoebamxxvr.supabase.co';
const key = import.meta.env.VITE_CLASS_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_uwRT04UOyTMJzFb551dOrQ_mj0oHUzA';

export const fetchClassFeed = signal => loadClassFeed({ url, key, signal });
