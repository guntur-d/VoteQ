import Volunteer from '../models/Volunteer.js';
import bcrypt from 'bcryptjs';


const authController = {
  async register(req, reply) {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const volunteer = new Volunteer({ name, email, passwordHash });
    await volunteer.save();
    reply.send({ success: true });
  },
  async login(req, reply) {
    const { email, password } = req.body;
    const volunteer = await Volunteer.findOne({ email });
    if (!volunteer) return reply.code(401).send({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, volunteer.passwordHash);
    if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });
    // Use Fastify's JWT plugin
    const token = await reply.jwtSign({ id: volunteer._id, role: volunteer.role });
    reply.send({ token });
  }
};
export default authController;
