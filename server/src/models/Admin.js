const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Replaces MySQL `admin_users`
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 50 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    // bcryptjs also verifies the PHP `$2y$` hashes from the old admin_users table.
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

adminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  // Skip re-hashing if a bcrypt hash was supplied (e.g. migrated from MySQL)
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

adminSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Admin', adminSchema);
