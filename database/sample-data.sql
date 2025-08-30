-- Sample data for testing the polling app
-- Run this after setting up the schema

-- Note: Replace 'your-user-id-here' with actual user IDs from your auth.users table

-- Sample Polls
INSERT INTO polls (id, title, description, author_id, allow_multiple_votes, require_login, end_date, status) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'What is your favorite programming language?',
  'Let''s see which programming language is most popular among developers in 2024.',
  'your-user-id-here',
  false,
  true,
  '2024-12-31 23:59:59+00',
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Which frameworks do you use for web development?',
  'Select all the frameworks you currently use or have used in the past year.',
  'your-user-id-here',
  true,
  false,
  '2024-06-30 23:59:59+00',
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'What is your preferred coffee type?',
  'A simple poll about coffee preferences - no login required!',
  'your-user-id-here',
  false,
  false,
  null,
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Best operating system for development?',
  'Which operating system do you prefer for software development?',
  'your-user-id-here',
  false,
  true,
  '2024-03-15 23:59:59+00',
  'ended'
);

-- Sample Poll Options for Poll 1 (Programming Languages)
INSERT INTO poll_options (poll_id, text, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'JavaScript', 1),
('550e8400-e29b-41d4-a716-446655440001', 'Python', 2),
('550e8400-e29b-41d4-a716-446655440001', 'TypeScript', 3),
('550e8400-e29b-41d4-a716-446655440001', 'Rust', 4),
('550e8400-e29b-41d4-a716-446655440001', 'Go', 5),
('550e8400-e29b-41d4-a716-446655440001', 'C++', 6);

-- Sample Poll Options for Poll 2 (Web Frameworks)
INSERT INTO poll_options (poll_id, text, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'React', 1),
('550e8400-e29b-41d4-a716-446655440002', 'Vue.js', 2),
('550e8400-e29b-41d4-a716-446655440002', 'Angular', 3),
('550e8400-e29b-41d4-a716-446655440002', 'Svelte', 4),
('550e8400-e29b-41d4-a716-446655440002', 'Next.js', 5),
('550e8400-e29b-41d4-a716-446655440002', 'Nuxt.js', 6),
('550e8400-e29b-41d4-a716-446655440002', 'Express.js', 7),
('550e8400-e29b-41d4-a716-446655440002', 'FastAPI', 8);

-- Sample Poll Options for Poll 3 (Coffee Types)
INSERT INTO poll_options (poll_id, text, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'Espresso', 1),
('550e8400-e29b-41d4-a716-446655440003', 'Cappuccino', 2),
('550e8400-e29b-41d4-a716-446655440003', 'Latte', 3),
('550e8400-e29b-41d4-a716-446655440003', 'Americano', 4),
('550e8400-e29b-41d4-a716-446655440003', 'Mocha', 5),
('550e8400-e29b-41d4-a716-446655440003', 'Flat White', 6);

-- Sample Poll Options for Poll 4 (Operating Systems)
INSERT INTO poll_options (poll_id, text, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'macOS', 1),
('550e8400-e29b-41d4-a716-446655440004', 'Windows', 2),
('550e8400-e29b-41d4-a716-446655440004', 'Linux', 3),
('550e8400-e29b-41d4-a716-446655440004', 'WSL (Windows Subsystem for Linux)', 4);

-- Sample Votes (replace voter_id with actual user IDs)
-- Note: These are example votes - in real usage, votes would be created through the app

-- Votes for Programming Languages poll
INSERT INTO votes (poll_id, option_id, voter_id, voter_ip) VALUES
-- JavaScript votes
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440001' AND text = 'JavaScript'), 'your-user-id-here', '192.168.1.1'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440001' AND text = 'JavaScript'), null, '192.168.1.2'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440001' AND text = 'JavaScript'), null, '192.168.1.3'),

-- Python votes
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440001' AND text = 'Python'), null, '192.168.1.4'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440001' AND text = 'Python'), null, '192.168.1.5'),

-- TypeScript votes
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440001' AND text = 'TypeScript'), null, '192.168.1.6'),

-- Rust votes
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440001' AND text = 'Rust'), null, '192.168.1.7');

-- Votes for Coffee Types poll (anonymous voting)
INSERT INTO votes (poll_id, option_id, voter_ip) VALUES
-- Espresso votes
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440003' AND text = 'Espresso'), '10.0.0.1'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440003' AND text = 'Espresso'), '10.0.0.2'),

-- Latte votes
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440003' AND text = 'Latte'), '10.0.0.3'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440003' AND text = 'Latte'), '10.0.0.4'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440003' AND text = 'Latte'), '10.0.0.5'),

-- Cappuccino votes
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM poll_options WHERE poll_id = '550e8400-e29b-41d4-a716-446655440003' AND text = 'Cappuccino'), '10.0.0.6');

-- Verify the data
SELECT 
  p.title,
  p.total_votes,
  p.status,
  COUNT(po.id) as option_count
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
GROUP BY p.id, p.title, p.total_votes, p.status
ORDER BY p.created_at DESC;

-- Check vote distribution for programming languages poll
SELECT 
  po.text as option_text,
  po.votes,
  ROUND((po.votes::float / p.total_votes * 100), 1) as percentage
FROM poll_options po
JOIN polls p ON po.poll_id = p.id
WHERE p.id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY po.votes DESC;
