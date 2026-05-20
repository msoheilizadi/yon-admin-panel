// src/components/MediaManager.jsx
import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function MediaManager() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'slider',
    type: 'image',
  });

  const fetchFiles = async () => {
    try {
      const res = await api.get('/admin/media');
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('لطفاً فایل را انتخاب کنید');

    const data = new FormData();
    data.append('file', selectedFile);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('type', formData.type);

    setUploading(true);
    try {
      await api.post('/admin/media', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('فایل با موفقیت آپلود شد');
      setSelectedFile(null);
      setFormData({ title: '', description: '', category: 'slider', type: 'image' });
      fetchFiles();
    } catch (err) {
      alert('خطا در آپلود: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) return;
    try {
      await api.delete(`/admin/media/${id}`);
      fetchFiles();
    } catch (err) {
      alert('خطا در حذف');
    }
  };

  if (loading) return <div>در حال بارگذاری...</div>;

  return (
    <div className="admin-container" style={{ marginTop: '2rem' }}>
      <div className="add-song-section">
        <h2>📁 آپلود فایل جدید</h2>
        <form onSubmit={handleSubmit} className="song-form">
          <input
            type="text"
            placeholder="عنوان"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="توضیحات (اختیاری)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="slider">اسلایدر صفحه اصلی</option>
            <option value="music">موسیقی</option>
            <option value="meditation">مراقبه</option>
            <option value="sleep">خواب</option>
            <option value="kid">کودک</option>
            <option value="profile">پروفایل کاربران</option>
          </select>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="image">تصویر</option>
            <option value="audio">صوت</option>
            <option value="video">ویدئو</option>
            <option value="document">مستند (PDF و غیره)</option>
          </select>
          <input
            type="file"
            accept="image/*,audio/*,video/*,application/pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            required
          />
          <button type="submit" disabled={uploading}>
            {uploading ? 'در حال آپلود...' : 'آپلود فایل'}
          </button>
        </form>
      </div>

      <div className="songs-list">
        <h2>📂 لیست فایل‌ها</h2>
        <div className="songs-grid">
          {files.map((file) => (
            <div key={file.id} className="song-card">
              {file.type === 'image' && (
                <img src={file.url} alt={file.title} className="song-cover" />
              )}
              {file.type === 'audio' && (
                <audio controls src={file.url} className="song-audio" />
              )}
              <div className="song-info">
                <div className="song-title">{file.title}</div>
                <div className="song-subtitle">
                  دسته: {file.category} | نوع: {file.type}
                </div>
                <button onClick={() => handleDelete(file.id)} className="delete-btn">
                  🗑 حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}