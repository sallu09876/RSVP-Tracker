-- Use password "password123" for all users
-- The hash is a real bcrypt hash generated for "password123"
INSERT INTO users (name, email, password_hash) VALUES
('Alice', 'alice@example.com', '$2b$10$JN0/7LtexXvd2CVMUNXs7.GO.OLNIbKjfdIfRYBiWjgrSUj9zFvDq'),
('Bob', 'bob@example.com', '$2b$10$JN0/7LtexXvd2CVMUNXs7.GO.OLNIbKjfdIfRYBiWjgrSUj9zFvDq'),
('Charlie', 'charlie@example.com', '$2b$10$JN0/7LtexXvd2CVMUNXs7.GO.OLNIbKjfdIfRYBiWjgrSUj9zFvDq'),
('Dave', 'dave@example.com', '$2b$10$JN0/7LtexXvd2CVMUNXs7.GO.OLNIbKjfdIfRYBiWjgrSUj9zFvDq');

INSERT INTO events (title, description, location, event_time, created_by) VALUES
('Tech Meetup', 'Monthly local tech meetup.', 'Downtown Library', DATE_ADD(NOW(), INTERVAL 7 DAY), 1),
('React Workshop', 'Deep dive into React Server Components.', 'Tech Hub', DATE_ADD(NOW(), INTERVAL 14 DAY), 2),
('Coffee & Code', 'Casual morning coding session.', 'Local Cafe', DATE_ADD(NOW(), INTERVAL 3 DAY), 3),
('Backend Architecture', 'Discussing scalable systems.', 'Online', DATE_ADD(NOW(), INTERVAL 21 DAY), 1),
('Startup Pitch Night', 'Pitch your ideas to local investors.', 'Innovation Center', DATE_ADD(NOW(), INTERVAL 30 DAY), 4);

INSERT INTO rsvps (event_id, user_id, status) VALUES
(1, 1, 'going'),
(1, 2, 'going'),
(1, 3, 'maybe'),
(2, 2, 'going'),
(2, 4, 'declined'),
(3, 1, 'going'),
(3, 3, 'going');
