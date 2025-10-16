import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';

export class User {
  static async create(userData) {
    const { name, email, password } = userData;
    
    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
        [userId, name, email, hashedPassword],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: userId,
              name,
              email
            });
          }
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }
}
