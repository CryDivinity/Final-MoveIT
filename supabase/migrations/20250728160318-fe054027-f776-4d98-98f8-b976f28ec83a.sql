-- Add more test feedback entries for a better display
INSERT INTO public.feedback (
  name, 
  email, 
  subject, 
  message, 
  rating, 
  status, 
  is_visible
) VALUES 
(
  'Maria Popescu',
  'maria@example.com',
  'Excellent Service',
  'The emergency features saved me when I had car trouble on the highway. The community really helps each other out!',
  5,
  'approved',
  true
),
(
  'Ion Ionescu',
  'ion@example.com',
  'Very Useful App',
  'Great way to connect with other drivers and stay informed about traffic conditions. Highly recommend!',
  4,
  'approved',
  true
),
(
  'Anna Moldovan',
  'anna@example.com',
  'Love the Features',
  'The navigation and community features are exactly what I needed for my daily commute. Thank you!',
  5,
  'approved',
  true
) ON CONFLICT DO NOTHING;