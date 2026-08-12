const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const verifyOwnership = require('../middleware/ownership');
const router = express.Router();

router.use(authenticateToken); // Protect all event routes

// GET /events
router.get('/', async (req, res) => {
  const { search } = req.query;
  try {
    let query = `
      SELECT e.id, e.title, e.description, e.location, e.event_time, e.created_by, u.name as creator_name 
      FROM events e 
      JOIN users u ON e.created_by = u.id
    `;
    let params = [];

    if (search) {
      query += ` WHERE e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY e.event_time ASC`;

    const [events] = await db.query(query, params);
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /events/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.title, e.description, e.location, e.event_time, e.created_by, u.name as creator_name 
      FROM events e 
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = rows[0];
    event.is_owner = (event.created_by === req.user.id);
    
    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /events
router.post('/', async (req, res) => {
  const { title, description, location, event_time } = req.body;

  if (!title || !location || !event_time) {
    return res.status(400).json({ error: 'Title, location, and event_time are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO events (title, description, location, event_time, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, location, event_time, req.user.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Event created successfully' });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /events/:id
router.put('/:id', verifyOwnership, async (req, res) => {
  const { title, description, location, event_time } = req.body;

  if (!title || !location || !event_time) {
    return res.status(400).json({ error: 'Title, location, and event_time are required' });
  }

  try {
    await db.query(
      'UPDATE events SET title = ?, description = ?, location = ?, event_time = ? WHERE id = ?',
      [title, description || null, location, event_time, req.params.id]
    );
    res.json({ message: 'Event updated successfully' });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /events/:id
router.delete('/:id', verifyOwnership, async (req, res) => {
  try {
    await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /events/:id/rsvps
router.get('/:id/rsvps', async (req, res) => {
  try {
    const [rsvps] = await db.query(`
      SELECT r.status, u.name, u.id as user_id
      FROM rsvps r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
    `, [req.params.id]);
    res.json(rsvps);
  } catch (err) {
    console.error('Error fetching RSVPs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /events/:id/rsvp
router.put('/:id/rsvp', async (req, res) => {
  const { status } = req.body;

  if (!status || !['going', 'maybe', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing status. Allowed: going, maybe, declined' });
  }

  try {
    // We should also check if the event exists, but foreign key constraints will handle invalid event_id.
    await db.query(
      'INSERT INTO rsvps (event_id, user_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
      [req.params.id, req.user.id, status, status]
    );
    res.json({ message: 'RSVP updated successfully' });
  } catch (err) {
    console.error('Error upserting RSVP:', err);
    // If the event_id is completely invalid (no matching event), foreign key constraint might fail. 
    // We can just return 500 or specifically catch ER_NO_REFERENCED_ROW_2
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
