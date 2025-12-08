/**
 * Example REST API Plugin for HoloBridge
 * 
 * This plugin demonstrates how to create a full CRUD REST API
 * with validation and persistent state.
 */

// In-memory storage for demo (replace with database in production)
const notes = new Map();
let nextId = 1;

export default {
    metadata: {
        name: 'notes-api',
        version: '1.0.0',
        author: 'HoloBridge',
        description: 'A simple notes API demonstrating plugin REST endpoints',
    },

    routes(router, ctx) {
        /**
         * GET /api/plugins/notes-api/notes
         * List all notes
         */
        router.get('/notes', (req, res) => {
            const allNotes = Array.from(notes.values());
            res.json({ success: true, data: allNotes });
        });

        /**
         * GET /api/plugins/notes-api/notes/:id
         * Get a specific note
         */
        router.get('/notes/:id', (req, res) => {
            const id = parseInt(req.params.id, 10);
            const note = notes.get(id);

            if (!note) {
                res.status(404).json({
                    success: false,
                    error: 'Note not found',
                    code: 'NOTE_NOT_FOUND',
                });
                return;
            }

            res.json({ success: true, data: note });
        });

        /**
         * POST /api/plugins/notes-api/notes
         * Create a new note
         */
        router.post('/notes', (req, res) => {
            const { title, content } = req.body;

            if (!title || typeof title !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Title is required',
                    code: 'VALIDATION_ERROR',
                });
                return;
            }

            const note = {
                id: nextId++,
                title,
                content: content || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            notes.set(note.id, note);

            // Emit event for other plugins
            ctx.eventBus.emitCustom('notes:created', { note });

            res.status(201).json({ success: true, data: note });
        });

        /**
         * PATCH /api/plugins/notes-api/notes/:id
         * Update a note
         */
        router.patch('/notes/:id', (req, res) => {
            const id = parseInt(req.params.id, 10);
            const note = notes.get(id);

            if (!note) {
                res.status(404).json({
                    success: false,
                    error: 'Note not found',
                    code: 'NOTE_NOT_FOUND',
                });
                return;
            }

            const { title, content } = req.body;

            // Validate title if provided
            if (title !== undefined) {
                if (typeof title !== 'string' || title.trim().length === 0) {
                    res.status(400).json({
                        success: false,
                        error: 'Title must be a non-empty string',
                        code: 'VALIDATION_ERROR',
                    });
                    return;
                }
                note.title = title;
            }

            if (content !== undefined) note.content = content;
            note.updatedAt = new Date().toISOString();

            ctx.eventBus.emitCustom('notes:updated', { note });

            res.json({ success: true, data: note });
        });

        /**
         * DELETE /api/plugins/notes-api/notes/:id
         * Delete a note
         */
        router.delete('/notes/:id', (req, res) => {
            const id = parseInt(req.params.id, 10);

            if (!notes.has(id)) {
                res.status(404).json({
                    success: false,
                    error: 'Note not found',
                    code: 'NOTE_NOT_FOUND',
                });
                return;
            }

            notes.delete(id);
            ctx.eventBus.emitCustom('notes:deleted', { id });

            res.json({ success: true, message: 'Note deleted' });
        });

        /**
         * GET /api/plugins/notes-api/stats
         * Get notes statistics
         */
        router.get('/stats', (req, res) => {
            const allNotes = Array.from(notes.values());
            res.json({
                success: true,
                data: {
                    total: allNotes.length,
                    averageContentLength: allNotes.length > 0
                        ? Math.round(allNotes.reduce((sum, n) => sum + n.content.length, 0) / allNotes.length)
                        : 0,
                },
            });
        });
    },

    events(on, ctx) {
        return [
            // Listen for own events (for logging)
            on.onCustom('notes:created', (data) => {
                ctx.logger.info(`Note created: "${data.note.title}"`);
            }),
        ];
    },

    onLoad(ctx) {
        ctx.logger.info('Notes API plugin loaded!');
        ctx.logger.info('Endpoints available at /api/plugins/notes-api/');
    },

    onUnload() {
        // Clear data on unload
        notes.clear();
        console.log('[notes-api] Cleaned up');
    },
};
