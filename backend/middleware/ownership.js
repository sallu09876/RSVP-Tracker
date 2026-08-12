const db = require('../db');

async function verifyOwnership(req, res, next) {
  const eventId = req.params.id;
  
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    const [rows] = await db.query('SELECT created_by FROM events WHERE id = ?', [eventId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = rows[0];

    // Ensure both are compared as numbers in case JWT payload or DB driver returns a string
    if (Number(event.created_by) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'You are not the owner of this event' });
    }

    next();
  } catch (err) {
    console.error('Error verifying ownership:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = verifyOwnership;
