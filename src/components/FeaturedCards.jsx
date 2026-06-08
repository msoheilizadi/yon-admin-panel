import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import AudioPlayer from './AudioPlayer';  // ✅ استفاده از کامپوننت سفارشی

export default function FeaturedCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ title: '', subtitle: '', description: '', order: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const fetchCards = async () => {
    try {
      const res = await api.get('/admin/featured-cards');
      setCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert('انتخاب تصویر الزامی است');
    const data = new FormData();
    data.append('image', imageFile);
    if (audioFile) data.append('audio', audioFile);
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    setUploading(true);
    try {
      await api.post('/admin/featured-cards', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ title: '', subtitle: '', description: '', order: 0 });
      setImageFile(null);
      setAudioFile(null);
      fetchCards();
    } catch (err) {
      alert('خطا: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف شود؟')) return;
    try {
      await api.delete(`/admin/featured-cards/${id}`);
      fetchCards();
    } catch (err) {
      alert('خطا در حذف: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="manager-container">
      <h2>🃏 مدیریت کارت‌های خانه</h2>

      <div className="add-song-section">
        <h3>➕ افزودن کارت جدید</h3>
        <form onSubmit={handleSubmit} className="song-form">
          <input
            placeholder="عنوان *"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <input
            placeholder="زیر عنوان"
            value={formData.subtitle}
            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
          />
          <input
            type="number"
            placeholder="ترتیب نمایش (0 = اول)"
            value={formData.order}
            onChange={e => setFormData({ ...formData, order: e.target.value })}
          />
          <textarea
            placeholder="توضیحات"
            value={formData.description}
            rows="3"
            className="full-width"
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="form-field full-width">
            <label>تصویر کارت *</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
              required
            />
          </div>
          <div className="form-field full-width">
            <label>فایل صوتی (اختیاری)</label>
            <input
              type="file"
              accept="audio/*"
              onChange={e => setAudioFile(e.target.files[0])}
            />
          </div>
          <button type="submit" disabled={uploading} className="full-width">
            {uploading ? 'در حال آپلود...' : 'ذخیره کارت'}
          </button>
        </form>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <div className="songs-grid">
          {cards.length === 0 && (
            <p style={{ color: 'var(--text-light)' }}>هیچ کارتی یافت نشد</p>
          )}
          {cards.map(card => (
            <div key={card.id} className="song-card">
              <img src={card.imageUrl} alt={card.title} className="song-cover" />
              <div className="song-info">
                <div className="song-title">{card.title}</div>
                {card.subtitle && <div className="song-subtitle">{card.subtitle}</div>}
                {card.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    {card.description}
                  </p>
                )}
                {/* ✅ AudioPlayer سفارشی به جای <audio controls> */}
                {card.audioUrl && (
                  <div style={{ marginTop: 8, marginBottom: 4 }}>
                    <AudioPlayer
                      src={card.audioUrl}
                      title={card.title}
                      subtitle={card.subtitle}
                      compact
                    />
                  </div>
                )}
                <button onClick={() => handleDelete(card.id)} className="delete-btn">
                  🗑 حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}