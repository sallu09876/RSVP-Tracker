CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_event_time ON events(event_time);
CREATE INDEX idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX idx_rsvps_user_id ON rsvps(user_id);
