import { redirect } from 'next/navigation';

/**
 * DEPRECATED: /admin/trend-fusion
 * 
 * This route has been consolidated into Content Intelligence.
 * Auto-redirecting to maintain backward compatibility.
 */
export default function TrendFusionRedirect() {
  redirect('/admin/intelligence');
}


