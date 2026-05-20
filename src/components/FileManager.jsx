import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

const CATEGORIES = [
  { id: 'Music', label: '🎵 موسیقی', folder: 'music' },
  { id: 'Meditation', label: '🧘 مراقبه', folder: 'meditation' },
  { id: 'Sleep', label: '😴 خواب', folder: 'sleep' },
  { id: 'Kid', label: '🧸 کودک', folder: 'kid' },
];

export default function FileManager() {
  const [activeCategory, setActiveCategory] = useState('Music');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(''); // برای فیلتر
  const [albumsList, setAlbumsList] = useState([]); // لیست آلبوم‌های موجود در دسته

  const [formData, setFormData] = useState({
    title: '', subtitle: '', description: '', album: '', duration: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState(null);

  // دریافت لیست فایل‌ها از سرور
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/songs?category=${activeCategory}&limit=100`);
      const songs = res.data.songs || [];
      setFiles(songs);
      // استخراج لیست آلبوم‌های منحصربه‌فرد برای فیلتر
      const albums = [...new Set(songs.map(s => s.album).filter(Boolean))];
      setAlbumsList(albums);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    setSelectedAlbum(''); // ریست فیلتر با تغییر دسته
  }, [activeCategory]);

  // فیلتر فایل‌ها بر اساس آلبوم انتخاب شده
  const filteredFiles = selectedAlbum ? files.filter(f => f.album === selectedAlbum) : files;

  // پیش‌نمایش تصویر و صدا
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else setPreviewImageUrl(null);
  }, [imageFile]);

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setPreviewAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else setPreviewAudioUrl(null);
  }, [audioFile]);

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این آیتم اطمینان دارید؟')) return;
    try {
      await api.delete(`/admin/songs/${id}`);
      fetchFiles();
    } catch (err) {
      alert('خطا در حذف');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !audioFile) {
      alert('لطفاً تصویر و فایل صوتی را انتخاب کنید');
      return;
    }
    const data = new FormData();
    data.append('image', imageFile);
    data.append('audio', audioFile);
    data.append('category', activeCategory);
    for (let key in formData) {
      if (formData[key]) data.append(key, formData[key]);
    }
    setUploading(true);
    try {
      await api.post('/admin/songs', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('فایل با موفقیت آپلود شد');
      setFormData({ title: '', subtitle: '', description: '', album: '', duration: '' });
      setImageFile(null);
      setAudioFile(null);
      fetchFiles();
    } catch (err) {
      alert('خطا در آپلود: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="manager-container">
      <h2>📁 مدیریت فایل‌ها</h2>

      {/* تب‌های دسته‌بندی */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* فیلتر آلبوم (در صورت وجود آلبوم‌ها) */}
      {albumsList.length > 0 && (
        <div className="album-filter" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>فیلتر بر اساس آلبوم:</span>
          <button className={`filter-album-btn ${selectedAlbum === '' ? 'active' : ''}`} onClick={() => setSelectedAlbum('')}>همه</button>
          {albumsList.map(alb => (
            <button key={alb} className={`filter-album-btn ${selectedAlbum === alb ? 'active' : ''}`} onClick={() => setSelectedAlbum(alb)}>
              {alb}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* فرم آپلود */}
        <div className="add-song-section" style={{ flex: 2 }}>
          <h3>➕ افزودن فایل جدید در {CATEGORIES.find(c => c.id === activeCategory)?.label}</h3>
          <form onSubmit={handleSubmit} className="song-form" encType="multipart/form-data">
            <div className="form-field">
              <label>عنوان (Title) *</label>
              <input name="title" placeholder="مثال: آرامش شب" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label>زیر عنوان (Subtitle)</label>
              <input name="subtitle" placeholder="مثال: ۱۰ دقیقه" value={formData.subtitle} onChange={handleChange} />
            </div>
            <div className="form-field full-width">
              <label>توضیحات (Description)</label>
              <textarea name="description" placeholder="توضیحات کامل..." value={formData.description} onChange={handleChange} rows="3" />
            </div>
            <div className="form-field">
              <label>آلبوم (Album) * برای گروه‌بندی در اپ</label>
              <input name="album" placeholder="نام آلبوم (مثلاً: موسیقی آرام)" value={formData.album} onChange={handleChange} required />
              <small>در اپ، فایل‌ها بر اساس همین آلبوم گروه‌بندی می‌شوند.</small>
            </div>
            <div className="form-field">
              <label>مدت زمان (Duration) - ثانیه</label>
              <input name="duration" type="number" placeholder="مثال: 600" value={formData.duration} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label>تصویر کاور (Image) *</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required />
              <small>حداقل ابعاد پیشنهادی: ۵۰۰×۵۰۰ پیکسل</small>
            </div>
            <div className="form-field">
              <label>فایل صوتی (Audio) *</label>
              <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} required />
              <small>فرمت‌های مجاز: MP3, M4A, WAV</small>
            </div>
            <button type="submit" disabled={uploading} className="full-width">
              {uploading ? 'در حال آپلود...' : 'آپلود و ذخیره'}
            </button>
          </form>
        </div>

        {/* پیش‌نمایش (دقیقاً شبیه کارت UniversalMeditationList) */}
        <div className="preview-section" style={{ flex: 1.2, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', alignSelf: 'flex-start' }}>
          <h3 style={{ marginBottom: '1rem' }}>🔍 پیش‌نمایش در اپ</h3>
          <div className="preview-card" style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', padding: '1rem' }}>
              {/* تصویر در سمت راست */}
              <img
                src={previewImageUrl || 'https://via.placeholder.com/80x80?text=تصویر'}
                alt="preview"
                style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', marginRight: '1rem' }}
              />
              {/* محتوای متنی در سمت چپ (راست‌چین) */}
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-dark)' }}>{formData.title || 'عنوان نمونه'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  {formData.subtitle || 'زیرعنوان نمونه'}
                  {formData.album && <span style={{ marginRight: '8px', fontSize: '0.7rem', color: '#aaa' }}>({formData.album})</span>}
                </div>
                {previewAudioUrl && (
                  <audio controls src={previewAudioUrl} style={{ width: '100%', marginTop: '0.5rem', height: '36px' }} />
                )}
                {!previewAudioUrl && <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.5rem' }}>فایل صوتی انتخاب نشده</div>}
                {/* آیکون بوکمارک برای شبیه‌سازی */}
                <div style={{ textAlign: 'left', marginTop: '0.3rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>🔖 ذخیره (نماد)</span>
                </div>
              </div>
            </div>
            {formData.description && (
              <div style={{ padding: '0 1rem 1rem 1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-dark)', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
                {formData.description.length > 80 ? formData.description.substring(0, 80) + '...' : formData.description}
              </div>
            )}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
            * پیش‌نمایش بر اساس فایل‌های انتخاب شده در فرم
          </div>
        </div>
      </div>

      {/* لیست فایل‌های موجود با نمایش آلبوم */}
      <div className="files-list" style={{ marginTop: '2rem' }}>
        <h3>📋 لیست فایل‌های موجود در {CATEGORIES.find(c => c.id === activeCategory)?.label}
          {selectedAlbum && <span style={{ fontSize: '0.9rem', marginRight: '1rem' }}> (آلبوم: {selectedAlbum})</span>}
        </h3>
        {loading && <div>در حال بارگذاری...</div>}
        {!loading && filteredFiles.length === 0 && <p>هیچ فایلی در این دسته/آلبوم یافت نشد.</p>}
        <div className="songs-grid">
          {filteredFiles.map(song => (
            <div key={song.id} className="song-card">
              <img src={song.imageUrl} alt={song.title} className="song-cover" />
              <div className="song-info">
                <div className="song-title">{song.title}</div>
                {song.subtitle && <div className="song-subtitle">{song.subtitle}</div>}
                {song.album && <div className="song-album" style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '0.3rem' }}>آلبوم: {song.album}</div>}
                <audio controls src={song.audioUrl} className="song-audio" />
                <button onClick={() => handleDelete(song.id)} className="delete-btn">🗑 حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}