const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf-8');

const oldChangePw = `app.post('/api/auth/change-password', async (req: Request, res: Response) => {
    try {
      const { newPassword } = req.body;
      const { error } = await supabaseAdmin.auth.updateUser({ password: newPassword });
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true, message: 'Password berhasil diperbarui' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });`;

const newChangePw = `app.post('/api/auth/change-password', async (req: Request, res: Response) => {
    try {
      const { userId, newPassword } = req.body;
      if (!userId || !newPassword) return res.status(400).json({ error: 'Missing userId or newPassword' });
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true, message: 'Password berhasil diperbarui' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });`;

content = content.replace(oldChangePw, newChangePw);
fs.writeFileSync('api/index.ts', content);
