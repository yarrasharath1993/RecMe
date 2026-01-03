import { redirect } from 'next/navigation';

/**
 * DEPRECATED: /admin/reviews
 * 
 * This route has been consolidated into the Review Quality & Coverage page.
 * Auto-redirecting to maintain backward compatibility.
 */
export default function ReviewsRedirect() {
  redirect('/admin/reviews-coverage');
}




