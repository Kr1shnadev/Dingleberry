import { createClient } from '@supabase/supabase-js';
import cookie from 'cookie';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Get the existing stats
    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .eq('id', 'live_stats')
      .single();

    if (error) throw error;

    let count = data.count;
    let latestName = data.latestName;

    // Check for visitor cookie
    const cookies = cookie.parse(req.headers.cookie || '');
    if (!cookies.hasVisited) {
      count++; // increment for new visitor

      await supabase
        .from('stats')
        .update({ count })
        .eq('id', 'live_stats');

      // Set cookie for 1 year
      res.setHeader(
        'Set-Cookie',
        cookie.serialize('hasVisited', 'true', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 365,
          path: '/',
        })
      );
    }

    return res.status(200).json({ count, latestName });
  } catch (err) {
    console.error('Error in /api/data:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
