import { Download, Folder, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, uploadFile } from '../api';
import { EmptyState, ScreenLayout } from '../components';
import { FILE_CATEGORY_LABELS } from '../constants';

interface FileItem {
  readonly id: string;
  readonly category: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly orderId: string | null;
  readonly customerId: string | null;
  readonly createdAt: string;
  readonly owner: {
    readonly firstName: string;
    readonly lastName: string;
  };
}

const categoryColor: Record<string, string> = {
  SURVEY_PHOTO: 'bg-blue-900/40 text-blue-300 border-blue-800',
  DESIGN: 'bg-pink-900/40 text-pink-300 border-pink-800',
  PRODUCTION_PHOTO: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  INSTALLATION_PHOTO: 'bg-cyan-900/40 text-cyan-300 border-cyan-800',
  DOCUMENT: 'bg-slate-700 text-slate-300 border-slate-600',
};

export const FilesScreen = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [category, setCategory] = useState('SURVEY_PHOTO');
  const [orderId, setOrderId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);

  const [filterCategory, setFilterCategory] = useState('');

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ pageSize: '100' });

      if (filterCategory) {
        params.set('category', filterCategory);
      }

      const response = await api.get(`/files?${params.toString()}`);
      setFiles(response.data.items || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory]);

  const resetForm = () => {
    setCategory('SURVEY_PHOTO');
    setOrderId('');
    setCustomerId('');
    setPickedFiles([]);
    setShowForm(false);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (pickedFiles.length === 0) {
      setUploadError('Выберите файлы');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      for (const file of pickedFiles) {
        await uploadFile(file, {
          category,
          ...(orderId ? { orderId } : {}),
          ...(customerId ? { customerId } : {}),
        });
      }

      resetForm();
      await loadFiles();
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await api.delete(`/files/${fileId}`);
      await loadFiles();
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления');
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await api.get(`/files/${file.id}/download`);
      const url =
        typeof response.data === 'string' ? response.data : response.data.url;

      if (url) {
        window.open(url, '_blank');
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось получить ссылку');
    }
  };

  const actions = [
    {
      icon: showForm ? <X className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />,
      onClick: () => setShowForm(!showForm),
      variant: 'primary' as const,
      label: showForm ? 'Закрыть форму' : 'Загрузить файлы',
    },
    {
      icon: <RefreshCw className="w-4 h-4 text-slate-400" />,
      onClick: loadFiles,
      variant: 'ghost' as const,
      label: 'Обновить',
    },
  ];

  return (
    <ScreenLayout title="Документы" onBack={() => navigate(-1)} actions={actions}>
      {/* Фильтр по категории */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
            !filterCategory
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          Все
        </button>
        {Object.entries(FILE_CATEGORY_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilterCategory(value)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
              filterCategory === value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            >
              {Object.entries(FILE_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              ID заказа (необязательно)
            </label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="UUID заказа"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              ID клиента (необязательно)
            </label>
            <input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="UUID клиента"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Файлы</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={(e) => setPickedFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-slate-300"
            />
            {pickedFiles.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Выбрано файлов: {pickedFiles.length}
              </p>
            )}
          </div>
          {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors"
          >
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Загрузка...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-800">
          <p className="text-red-400 text-sm">Ошибка: {error}</p>
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <EmptyState icon={Folder} title="Файлов пока нет" hint="Нажмите «+», чтобы загрузить" />
      )}

      {!loading && !error && files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-100 truncate">
                    {file.originalName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        categoryColor[file.category] ||
                        'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {FILE_CATEGORY_LABELS[file.category] || file.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {(file.sizeBytes / 1024).toFixed(0)} КБ
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                    aria-label="Скачать"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-red-400"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {file.owner.firstName} {file.owner.lastName} ·{' '}
                {new Date(file.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScreenLayout>
  );
};
