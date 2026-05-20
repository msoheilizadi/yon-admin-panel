// UsersManager.jsx - نسخه نهایی بدون ایموجی و بدون فیلدهای زبان و زمان یادآوری
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axiosConfig';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError('خطا در دریافت لیست کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) { alert('خطا در حذف کاربر'); }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) { alert('خطا در تغییر نقش'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('لطفاً تمام فیلدهای الزامی را پر کنید.');
      return;
    }
    if (newUser.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/users', newUser);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
      alert('کاربر با موفقیت ایجاد شد');
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در ایجاد کاربر');
    } finally {
      setCreating(false);
    }
  };

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError('');
    setNewUser({ name: '', email: '', password: '', role: 'user' });
  };

  const openEditModal = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditError('');
  };

  const handleEditChange = (e) => {
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editingUser.name || !editingUser.email) {
      setEditError('نام و ایمیل الزامی هستند.');
      return;
    }
    setUpdating(true);
    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        name: editingUser.name,
        email: editingUser.email,
        mobile: editingUser.mobile,
      });
      closeEditModal();
      fetchUsers();
      alert('اطلاعات کاربر با موفقیت به‌روز شد');
    } catch (err) {
      setEditError(err.response?.data?.message || 'خطا در به‌روزرسانی کاربر');
    } finally {
      setUpdating(false);
    }
  };

  const RoleDropdown = ({ userId, currentRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const options = [
      { value: 'user', label: 'کاربر عادی' },
      { value: 'admin', label: 'ادمین' }
    ];

    const handleSelect = (newRole) => {
      handleRoleChange(userId, newRole);
      setIsOpen(false);
    };

    const toggleDropdown = () => {
      if (!isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.right - 130,
        });
      }
      setIsOpen(!isOpen);
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (buttonRef.current && !buttonRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    return (
      <div className="role-dropdown">
        <button ref={buttonRef} className="role-badge" onClick={toggleDropdown}>
          {currentRole === 'admin' ? 'ادمین' : 'کاربر عادی'}
          <span className="role-arrow">▼</span>
        </button>
        {isOpen && createPortal(
          <div className="role-dropdown-menu-portal" style={{ position: 'absolute', top: position.top, left: position.left, zIndex: 9999 }}>
            {options.map(opt => (
              <div key={opt.value} className={`role-dropdown-item ${currentRole === opt.value ? 'active' : ''}`} onClick={() => handleSelect(opt.value)}>
                {opt.label}
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">در حال بارگذاری کاربران...</div>;

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h2>مدیریت کاربران</h2>
        <button className="create-user-btn" onClick={() => setShowCreateModal(true)}>
          + ایجاد کاربر جدید
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ایجاد کاربر جدید</h3>
              <button className="modal-close" onClick={closeCreateModal}>✕</button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleCreateUser} className="user-form-modal">
              <div className="form-field"><label>نام کامل *</label><input type="text" name="name" value={newUser.name} onChange={handleNewUserChange} required /></div>
              <div className="form-field"><label>ایمیل *</label><input type="email" name="email" value={newUser.email} onChange={handleNewUserChange} required /></div>
              <div className="form-field"><label>رمز عبور * (حداقل ۶ کاراکتر)</label><input type="password" name="password" value={newUser.password} onChange={handleNewUserChange} required /></div>
              <div className="form-field"><label>نقش</label><select name="role" value={newUser.role} onChange={handleNewUserChange}><option value="user">کاربر عادی</option><option value="admin">ادمین</option></select></div>
              <button type="submit" disabled={creating} className="submit-user-btn">{creating ? 'در حال ایجاد...' : 'ایجاد کاربر'}</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ویرایش کاربر</h3>
              <button className="modal-close" onClick={closeEditModal}>✕</button>
            </div>
            {editError && <div className="error-message">{editError}</div>}
            <form onSubmit={handleUpdateUser} className="user-form-modal">
              <div className="form-field"><label>نام کامل *</label><input type="text" name="name" value={editingUser.name} onChange={handleEditChange} required /></div>
              <div className="form-field"><label>ایمیل *</label><input type="email" name="email" value={editingUser.email} onChange={handleEditChange} required /></div>
              <div className="form-field"><label>شماره موبایل</label><input type="text" name="mobile" value={editingUser.mobile || ''} onChange={handleEditChange} /></div>
              <button type="submit" disabled={updating} className="submit-user-btn">{updating ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button>
            </form>
          </div>
        </div>
      )}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>ایمیل</th>
              <th>موبایل</th>
              <th>نقش</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.mobile || '-'}</td>
                <td><RoleDropdown userId={user.id} currentRole={user.role || 'user'} /></td>
                <td>
                  <button className="edit-btn-small" onClick={() => openEditModal(user)}>ویرایش</button>
                  <button className="delete-btn-small" onClick={() => handleDelete(user.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}