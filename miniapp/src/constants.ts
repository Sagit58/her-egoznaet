/**
 * Shared label/color maps for order statuses, stage types/stages, and
 * employee roles. Kept in one place so list screens and the dashboard stay
 * consistent and we avoid duplicating these lookup tables per screen.
 */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-900/40 text-blue-300 border-blue-800',
  IN_PROGRESS: 'bg-orange-900/40 text-orange-300 border-orange-800',
  COMPLETED: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  CANCELLED: 'bg-red-900/40 text-red-300 border-red-800',
};

export const ORDER_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export const STAGE_TYPE_LABELS: Record<string, string> = {
  SURVEY: 'Замер',
  DESIGN: 'Дизайн',
  PRODUCTION: 'Производство',
  INSTALLATION: 'Установка',
};

export const STAGE_TYPE_ORDER = ['SURVEY', 'DESIGN', 'PRODUCTION', 'INSTALLATION'];

export const STAGE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В работе',
  DONE: 'Завершён',
};

export const STAGE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-700 text-slate-300 border-slate-600',
  IN_PROGRESS: 'bg-orange-900/40 text-orange-300 border-orange-800',
  DONE: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
};

export const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: 'Администратор',
  DIRECTOR: 'Директор',
  MANAGER: 'Менеджер',
  SURVEYOR: 'Замерщик',
  DESIGNER: 'Дизайнер',
  PRODUCTION: 'Производство',
  INSTALLER: 'Установщик',
  WAREHOUSE: 'Склад',
  ACCOUNTANT: 'Бухгалтер',
};

export const ROLE_COLORS: Record<string, string> = {
  ADMINISTRATOR: 'bg-purple-900/40 text-purple-300 border-purple-800',
  DIRECTOR: 'bg-blue-900/40 text-blue-300 border-blue-800',
  MANAGER: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  SURVEYOR: 'bg-orange-900/40 text-orange-300 border-orange-800',
  DESIGNER: 'bg-pink-900/40 text-pink-300 border-pink-800',
  PRODUCTION: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  INSTALLER: 'bg-cyan-900/40 text-cyan-300 border-cyan-800',
  WAREHOUSE: 'bg-slate-700 text-slate-300 border-slate-600',
  ACCOUNTANT: 'bg-teal-900/40 text-teal-300 border-teal-800',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Наличные',
  CARD: 'Карта',
  TRANSFER: 'Перевод',
};

export const FILE_CATEGORY_LABELS: Record<string, string> = {
  SURVEY_PHOTO: 'Фото замера',
  DESIGN: 'Дизайн',
  PRODUCTION_PHOTO: 'Фото производства',
  INSTALLATION_PHOTO: 'Фото установки',
  DOCUMENT: 'Документ',
};

export const formatRub = (value: number): string =>
  value.toLocaleString('ru-RU') + ' ₽';
