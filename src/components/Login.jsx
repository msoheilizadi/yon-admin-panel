import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'ورود ناموفق');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>ورود به پنل مدیریت</h2>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          <input
            type="email"
            placeholder="ایمیل ادمین"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">ورود</button>
        </form>
      </div>
    </div>
  );
}