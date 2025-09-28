import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name cannot be empty.' });
    }

    await supabase
      .from('stats')
      .update({ latestName: name })
      .eq('id', 'live_stats');

    return res.status(200).json({ success: true, latestName: name });
  } catch (err) {
    console.error('Error in /api/name:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
