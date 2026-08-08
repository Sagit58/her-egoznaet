# Комплексный апгрейд Monument ERP — фронтенд + бэкенд

Вы согласовали: **только фичи** (безопасность не трогаем), **переход на react-router-dom**, полный объём за один заход.

## Часть A. Бэкенд (усиление)

### A1. Эндпоинт статистики дашборда `GET /api/v1/orders/stats`
Сейчас `hooks.ts` вычисляет статистику двумя запросами, и результат неверный: «активные» = «всего», «выручка» = 0. Добавлю настоящий агрегатный эндпоинт.
- Новый модуль-сервис `order-stats` (или метод `OrderService.getStats()`)
- `GET /api/v1/orders/stats` → `{ totalOrders, activeOrders, completedOrders, totalRevenue, paidTotal, debtTotal }`
- Реализация через `prisma.order.aggregate` (count + `_sum: { totalAmount }`) по статусам + `_sum` по payments
- Permission: `order.list` (минимальное чтение)
- Регистрация в `order-routes.ts` + `container.ts`

### A2. Фикс `graveSite` в ответе заказа (баг→ Google Maps не работает)
`order-repository.ts:14` выбирает у `grave_site` только `{id, name, address}` — без `latitude`/`longitude`, хотя `OrderDto` (`order-service.ts:53-59`) и фронтенд их ожидают. Кнопка «Открыть в Google Maps» никогда не получает координат.
- Добавить `latitude: true, longitude: true` в `orderInclude.grave_site.select`

### A3. Эндпоинт «мои задачи» `GET /api/v1/orders/assigned`
Сейчас исполнитель (замерщик/дизайнер/производство/установщик) видит все заказы без фильтра. Добавлю выборку заказов со stage, назначенным на текущего сотрудника.
- `GET /api/v1/orders?assignedTo=:employeeId` — расширяю существующий `orderListQuerySchema` и `list()` в репозитории (новый фильтр по `stages.assignedEmployeeId`), а не новый эндпоинт (сохраняет консистентность с пагинацией/сортировкой)
- Так исполнителям будет проще: один фильтр «назначено мне»

### A4. Выравнивание RBAC (минимальное, без новых маршрутов)
Сейчас `PATCH /orders/:id/stages/:type` использует permission `order.change-status`, хотя `role-permissions.ts` даёт ролям `design.create`/`production.update` и т.д. — они «висят».
- Не буду плодить новые маршруты на каждое permission (избыточно). Вместо этого сделаю stage-update permission осмысленным: поменяю preHandler на динамический `requireStagePermission(type)` — `SURVEY→order.change-status`, `DESIGN→design.update`, `PRODUCTION→production.update`, `INSTALLATION→installation.update`. Так роли DESIGNER/PRODUCTION/INSTALLER смогут двигать свои этапы, а MANAGER — все через `order.change-status` (он уже имеет его). Это соединит матрицу RBAC с реальными маршрутами.

## Часть B. Фронтенд (дополнение + удобство)

### B1. Переход на react-router-dom
Установлю `react-router-dom` в `miniapp/`. Переделаю `App.tsx`:
- Routes: `/dashboard`, `/orders`, `/orders/:id`, `/customers`, `/customers/:id` (новый), `/employees`, `/files`, `/branches`, `/login`
- `AuthGate`-обёртка защищает приватные роуты; редирект на `/login` при отсутствии токена
- Кнопка «Назад» теперь работает через `useNavigate(-1)` + кнопка браузера
- Глубокие ссылки: можно открыть `—/orders/123` напрямую
- Сохраню существующий тёмный slate-стиль и компонентный подход

### B2. Новые экраны
1. **`FilesScreen`** (Документы) — список файлов по фильтру (по заказу/клиенту/категории), загрузка (multi), превью для фото (presigned URL), удаление. API `/api/v1/files` уже полностью готов.
2. **`BranchesScreen`** (Филиалы) — список + создание + редактирование. API готов.
3. **`CustomerDetailScreen`** (новый, `CustomersScreen` сейчас только список) — карточка клиента: контакты (add/delete), заметки (add), список заказов клиента (фильтр `?customerId=`).

### B3. Доработка существующих экранов

**`OrderDetailScreen`** — самый ценный апгрейд. Сейчас 3 таба (Инфо/Фото/Место). Добавлю:
- **Таб «Этапы»**: визуализация пайплайна Замер→Дизайн→Производство→Установка. Каждый этап: статус (PENDING/IN_PROGRESS/DONE), исполнитель (select из employees), даты, комментарий, кнопки «В работу»/«Завершить». Использует `PATCH /orders/:id/stages/:type` (бэкенд уже отдаёт `stages` в `GET /orders/:id`).
- **Таб «Оплаты»**: список платежей (сумма/метод/дата/коммент), форма «Добавить платёж», прогресс-бар оплачено/итого (`paidAmount` уже есть в DTO).
- **Таб «Инфо»**: кнопка смены статуса заказа (NEW→IN_PROGRESS→COMPLETED/CANCELLED) с подтверждением; 显示 manager/editor суммы; показ `paidAmount` и долга.
- Фикс использования GPS: после A2 «Открыть в Google Maps» заработает.

**`OrdersScreen`** — добавлю:
- Поле поиска (по номеру/имени клиента) — `?search=` уже поддерживается бэкендом
- Фильтр по статусу (чипы All/Новые/В работе/Завершены/Отменены) — `?status=` уже работает
- Сортировка (по дате/номеру/сумме) — `?sortBy&sortOrder` уже работает
- В карточке заказа: показать `paidAmount`/значок долга; бейдж просренности этапа

**`Dashboard`** (`App.tsx` + `hooks.ts`) — после A1:
- Реальные цифры: `totalOrders`, `activeOrders` (по статусу `IN_PROGRESS`), `totalRevenue`
- Добавлю мини-блок «Последние заказы» (top 5 newest) и быстрый доступ

### B4. Общие улучшения UX
- Вынесу повторяющиеся UI-паттерны в мелкие переиспользуемые компоненты:
  - `ScreenLayout` (header c «Назад» + действиями, контейнер)
  - `EmptyState` (иконка + текст)
  - `LoadingState` / `ErrorState`
  - `StatusBadge`
- Это уберёт копипасту из Orders/Customers/Employees (сейчас каждый экран повторяет шапку, empty/error/loading блоки)
- Не буду вводить UI-кит — только минимальные компоненты в духе существующего кода

## Порядок реализации (внутри одного захода)

1. Бэкенд: A2 (фикс GPS) → A1 (stats) → A3 (assignedTo) → A4 (stage RBAC) + `tsc` проверка
2. Фронтенд: B1 (react-router, App.tsx) → B4 (общие компоненты) → B2 (Files/Branches/CustomerDetail) → B3 (OrderDetail этапы/оплаты, OrdersScreen фильтры, Dashboard) → `tsc -b && vite build`

## Что НЕ делаем (по вашему решению)
- ❌ Безопасность: `.env`, токен бота в клиенте, forgeable initData — не трогаем
- ❌ Тесты и CI — не в рамках этого захода
- Версии/миграции БД не нужны — A1/A3 реализуются агрегатными запросами Prisma без изменений схемы

## Проверка
- Бэкенд: `npm run build` (tsc strict) — должен пройти без ошибок типов
- Фронтенд: `npm run build` (`tsc -b && vite build`) — должен пройти без ошибок типов
- Локальный запуск и E2E — оставляю вам (нет БД/MinIO окружения на моей стороне). Все API-формы запросов/ответов сверены с реальными маршрутами, эндпоинты будут compatible с фронтендом.

## Затрагиваемые файлы (предварительно)
**Бэкенд:** `order-repository.ts`, `order-service.ts`, `order-routes.ts`, `order.schemas.ts`, `auth-guard.ts` (новый хелпер для stage permission), `container.ts`, `server.ts` (если надо — `/stats` регистрация)
**Фронтенд:** `App.tsx` (переделка под router), `main.tsx`, `api.ts`, `hooks.ts`, новые экраны `FilesScreen.tsx`/`BranchesScreen.tsx`/`CustomerDetailScreen.tsx`, переработанные `OrderDetailScreen.tsx`/`OrdersScreen.tsx`, новые общие компоненты, `miniapp/package.json` (react-router-dom)