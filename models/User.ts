import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Verifica se o modelo já existe para evitar recompilação
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 