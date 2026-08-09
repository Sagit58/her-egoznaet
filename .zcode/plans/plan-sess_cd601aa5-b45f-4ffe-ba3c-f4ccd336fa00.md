# Улучшения функционала фронта (+ затронутый бэкенд)

## Контекст и текущее состояние
- **Бэк**: `POST /api/v1/orders` требует `customerId: z.string().uuid()` (обязательно), `OrderService` зависит только от `OrderRepository` (нет `CustomerService`). Создание клиента «вместе» с заказом не поддерживается. PATCH `/orders/:id` уже принимает `{ comment, totalAmount, managerId, graveSiteId }`, PATCH `/customers/:id` — `{ firstName, lastName, middleName, phone, email, comment }` — т.е. эндпоинты редактирования уже есть, фронт их не вызывает.
- **Фронт**: создание заказа (`OrdersScreen`) — выбор клиента из плоского `<select>` первых 100 клиентов; форма клиента (`CustomersScreen`) — только 3 поля (Фамилия/Имя/Телефон); `CustomerDetailScreen` — профиль read-only; `OrderDetailScreen` — смена статуса/этапов/оплаты/фото/места, но не основных полей заказа. Успех сабмита молчаливый. Нет toast, нет переиспользуемых LoadingState/ErrorState.

## Решения пользователя
- Авто-создание клиента: **гибрид** — бэк поддерживает `customerId` ИЛИ `newCustomer`, атомарно в одной транзакции; фронт шлёт один POST.
- Поиск клиента в форме заказа: **свой фронт-combobox** (без зависимостей, debounce 300мс, `GET /customers?search=...&pageSize=20`).
- Toast/уведомления: **`sonner`** (новая dependency).
- Объём: **всё сразу** — бэк + фронт за один заход.

---

## ЧАСТЬ A. Бэкенд — гибридная схема «клиент вместе с заказом»

### A1. `src/modules/orders/order.schemas.ts`
Расширить `createOrderBodySchema` дискриминированным выбором — либо `customerId`, либо `newCustomer`:

```ts
const newCustomerSchema = z.object({
  firstName:  z.string().trim().min(1),
  lastName:   z.string().trim().min(1),
  middleName: z.string().trim().optional(),
  phone:      z.string().trim().min(1),
  email:      z.string().trim().optional(),
  comment:    z.string().trim().optional(),
});

export const createOrderBodySchema = z.object({
  customerId: z.string().uuid().optional(),
  newCustomer: newCustomerSchema.optional(),
  number: z.number().int().positive().optional(),
  graveSiteId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  comment: z.string().trim().optional(),
  totalAmount: z.number().nonnegative().optional(),
}).refine((d) => d.customerId || d.newCustomer, {
  message: 'Необходимо указать customerId или newCustomer',
  path: ['customerId'],
});

export type NewCustomerInput = z.infer<typeof newCustomerSchema>;
```
`updateOrderBodySchema` и `orderListQuerySchema` — без изменений. Бэк остаётся обратно-совместимым: `{ customerId }` по-прежнему валиден.

### A2. `src/modules/orders/order-repository.ts`
Расширить `OrderWriteInput` опциональным `newCustomer` и создать клиента внутри существующей `prisma.$transaction` (уже используется для автоинкремента `number`):

```ts
export interface OrderWriteInput {
  readonly customerId?: string | null;
  readonly newCustomer?: NewCustomerInput;
  readonly graveSiteId?: string | null;
  readonly managerId?: string | null;
  readonly comment?: string | null;
  readonly totalAmount?: number;
}

async create(input: OrderWriteInput): Promise<OrderRecord> {
  return prisma.$transaction(async (tx) => {
    let customerId = input.customerId ?? null;
    if (!customerId && input.newCustomer) {
      const c = await tx.customer.create({ data: {
        firstName: input.newCustomer.firstName,
        lastName: input.newCustomer.lastName,
        middleName: input.newCustomer.middleName ?? null,
        phone: input.newCustomer.phone,
        email: input.newCustomer.email ?? null,
        comment: input.newCustomer.comment ?? null,
      }});
      customerId = c.id;
    }
    if (!customerId) throw AppError.badRequest('customerId or newCustomer required');

    const max = await tx.order.aggregate({ _max: { number: true } });
    const nextNumber = (max._max.number ?? 0) + 1;
    return tx.order.create({
      data: { number: nextNumber, customerId, graveSiteId: input.graveSiteId ?? null,
              managerId: input.managerId ?? null, comment: input.comment ?? null,
              totalAmount: input.totalAmount ?? 0,
              stages: { create: [ {type:'SURVEY'},{type:'DESIGN'},{type:'PRODUCTION'},{type:'INSTALLATION'} ] } },
      include: orderInclude,
    });
  });
}
```
Импорт `NewCustomerInput` из `order.schemas.ts` и `AppError` из `../../common/errors/app-error.ts`.

### A3. `src/modules/orders/order-service.ts` и `order-routes.ts`
- `OrderService.create(input: OrderWriteInput)` — сигнатура уже совместима; `P2003`/`P2002` обработка сохраняется. Никаких изменений в сервисе не требуется (он пробрасывает input в `repository.create`).
- `order-routes.ts`: в обработчике `POST /orders` передавать ещё `newCustomer`: заменить блок `service.create({ customerId: body.customerId, ... })` на:
  ```ts
  service.create({
    customerId: body.customerId ?? null,
    newCustomer: body.newCustomer,
    graveSiteId: body.graveSiteId ?? null,
    managerId: body.managerId ?? null,
    comment: body.comment ?? null,
    totalAmount: body.totalAmount,
  })
  ```
- `OrderDto.customer` в `toDto` уже отражает созданного клиента (через `orderInclude.customer`), т.е. ответ остаётся идентичным по форме.

### A4. Контейнер (`src/container.ts`) — БЕЗ изменений
`OrderRepository` не получает `CustomerService` — клиент создаётся прямо через `prisma.$transaction` внутри репозитория, что сохраняет изоляцию модулей и не плодит межсервисных связей. Это осознанный выбор: по схеме БД `customers` — простая таблица без зависимостей, и вставка в той же транзакции безопасна и атомарна.

### A5. Без миграций БД
Схема БД не меняется (новый клиент — это новая запись в существующей `customers`, без новых колонок). Prisma-миграция не нужна.

---

## ЧАСТЬ B. Фронтенд

### B0. Зависимости
`miniapp/package.json` — добавить в `dependencies`: **`sonner`** (последняя stable, `^1.x`). Запустить `npm install sonner` в `miniapp/`. Sonner — единственная новая зависимость.

### B1. Toast-провайдер и переиспользуемые состояния
- **`miniapp/src/main.tsx`**: обернуть `<Router>` в `<Toaster position="top-center" richColors theme="dark" />` из `sonner`. Sonner самодостаточен (не требует своего Provider — используется через `<Toaster />` + импорт `toast`).
- **`miniapp/src/components/LoadingState.tsx`** (новый) — вынести повторяющийся `bg-slate-800 ... "Загрузка..."` в `<LoadingState text?="Загрузка..." />`.
- **`miniapp/src/components/ErrorState.tsx`** (новый) — вынести `bg-red-900/20 border-red-800 ...` в `<ErrorState error={string} />`.
- **`miniapp/src/components/index.ts`** — добавить экспорты `LoadingState`, `ErrorState`.
- Заменить inline loading/error блоки на `OrdersScreen`, `CustomersScreen`, `CustomerDetailScreen`, `OrderDetailScreen`, `FilesScreen`, `BranchesScreen`, `EmployeesScreen` (точечно, без переделки остального JSX).
- Все успешные сабмиты (создание/редактирование сущностей) — `toast.success('Заказ создан')` / `toast.success('Клиент сохранён')` и т.п.; ошибки (в catch) — `toast.error(...)` **в дополнение** к инлайн `setFormError` (toast как глобальная обратная связь, инлайн как локальная у формы).

### B2. Combobox выбора клиента (новый компонент)
- **`miniapp/src/components/CustomerCombobox.tsx`** (новый) — самописный combobox без зависимостей:
  - Props: `value: string | null`, `onChange: (id: string | null) => void`, `onCreateNew?: () => void` (опциональный колбэк «+ Создать нового клиента», открывает инлайн-форму нового клиента в форме заказа).
  - Поведение: `<input>` с debounce 300мс → при вводе `GET /customers?search=<query>&pageSize=20` → выпадающий список (`absolute z-10`) с вариантами `{lastName} {firstName} · {phone}`; клик выбирает (вызывает `onChange(id)` и показывает выбранное в инпуте). Клик вне — закрытие.
  - Внизу списка — кнопка-разделитель «+ Новый клиент» (если есть `onCreateNew`), которая открывает инлайн-поля Фамилия/Имя/Телефон (а также опц. Отчество/Email/Комментарий — см. B4).
- Экспортировать из `components/index.ts`.
- Стиль — в духе проекта: slate-variant Tailwind-классы, как у существующих input/select.

### B3. Форма создания заказа (`OrdersScreen.tsx`) — авто-создание клиента
- Заменить существующий `<select>` выбора клиента на `<CustomerCombobox>`.
- Добавить стейт режиме клиента: `customerMode: 'existing' | 'new'` (переключается внутри combobox через `onCreateNew`).
- В режиме «новый» показать инлайн-поля: `lastName* / firstName* / phone*` (опц. `middleName / email / comment`). Эти поля — единый блок над стандартными полями заказа (номер, сумма, адрес, фото, комментарий).
- Изменить `handleCreate`:
  - если `customerMode === 'new'` — валидация `lastName && firstName && phone` → `body.newCustomer = { lastName, firstName, phone, middleName?, email?, comment? }`;
  - если `customerMode === 'existing'` — валидация `customerId` → `body.customerId = customerId`;
  - затем как раньше: address/lat/long → `POST /grave-sites` → `body.graveSiteId`; `POST /orders` (ТЕПЕРЬ ОДИН ЗАПРОС — клиент создаётся на бэке атомарно) → цикл `uploadPhoto`.
  - После успеха: `toast.success('Заказ создан')`, сброс всех полей (включая `customerMode='existing'`, полей нового клиента), `setShowForm(false)`, `loadData()`.
- UX-деталь: если пользователь начал вводить имя, не нашёл клиента в списке → нажимает «+ Новый клиент» → форма переключается в режим `new`, инпут поиска сворачивается, выбранный поисковый текст переносится в `lastName`/`firstName` (best-effort split по пробелу).

### B4. Доп. поля клиента + редактирование
- **`CustomersScreen.tsx` — форма создания**: добавить поля `middleName`, `email`, `comment` (опциональные, после обязательных). `handleCreate` шлёт `{ lastName, firstName, phone, middleName?, email?, comment? }` (опц. поля вкладывать через `if (x) body.x = x`, как в паттерне). Успех → `toast.success('Клиент создан')`.
- **`CustomerDetailScreen.tsx` — форма редактирования профиля**: над блоком «Контактные данные» добавить кнопку «Редактировать» (иконка `Pencil` уже импортируется в проекте). Тогглит инлайн-форму со всеми полями (`firstName, lastName, middleName, phone, email, comment`), предзаполненными из `customer`. Сабмит → `PATCH /customers/:id` с изменёнными полями → `loadCustomer()` → `toast.success('Клиент сохранён')`. Стейт: `editingProfile`, `savingProfile`, `profileError`. Валидация: `firstName && lastName && phone` (минимум). Это закрывает зияющий пробел — `PATCH /customers/:id` сейчас не вызывается с фронта вообще.

### B5. Редактирование заказа (`OrderDetailScreen.tsx`)
- На табе «Инфо» добавить кнопку «Редактировать» (иконка `Pencil`, уже импортируется) → инлайн-форма со стейтами `editingOrder/savingOrder/orderError` и полями: `comment` (textarea), `totalAmount` (number), `managerId` (`<select>` из уже загружаемого на экране `employees`, отфильтровать активных — опц.).
- Сабмит → `PATCH /orders/:id { comment?, totalAmount?, managerId? }` (бэк уже поддерживает `updateOrderBodySchema`) → `loadOrder()` → `toast.success('Заказ сохранён')`. Опц. поля по паттерну `if (x !== '' && x != null) body.x = x`.
- Назначение `managerId`: `<select>` с опцией «— Без менеджера —» (передать `null` через `body.managerId = managerId || null`); `managerId` в `updateOrderBodySchema` сейчас `z.string().uuid().optional()` — для `null` нужно либо расширить схему на `.nullable()`, либо фронт просто не шлёт поле, если `''`. Решено: **A-дополнение — в `updateOrderBodySchema` сделать `managerId: z.string().uuid().nullable().optional()`** (и симметрично `graveSiteId` — он уже может быть `null` через detached). Это единственное点了нское доп. изменение бэка в этой части (минимальное, безопасное — обратно-совместимо).

### B6. Прочее (не трогаем в этом заходе)
- Дубликат `uploadPhoto` в `OrdersScreen` vs `uploadFile` в `api.ts` — оставляем (разный API-path/category для фото замера; рефакторинг не в скоупе).
- `FilesScreen` ввод `orderId/customerId` как UUID вручную — не в скоупе (можно заменить аналогичным combobox в следующем заходе).
- Типы `Order`/`Customer`, дублирующиеся на каждом экране, — не выносим (нет общего модуля типов; рефакторинг не в скоупе).
- `App.css` boilerplate-мусор — не трогаем.

---

## ЧАСТЬ C. Проверка и риск-контроль

### C1. Что проверить после реализации
- Бэк: `tsc -b` компилится; `POST /orders` с телом `{ newCustomer: {...}, totalAmount }` создаёт и клиента, и заказ, и 4 этапа в одной транзакции (проверить через БД или ответ `OrderDto`). `POST /orders` со старым `{ customerId }` — по-прежнему работает (обратная совместимость). `PATCH /orders/:id { managerId: null }` теперь валиден. `PATCH /customers/:id` со всеми полями — валиден.
- Фронт: `npm run build` (`tsc -b && vite build`) и `npm run lint` (`oxlint`) проходят. Создание заказа: выбор существующего клиента через combobox-поиск; создание нового «на лету» (одно поле «Клиент» переключается между modes); toast «Заказ создан» появляется; если бэк вернул 400/409 — `toast.error` + инлайн ошибка у формы. Редактирование клиента (Pencil на CustomerDetail) сохраняет изменения; редактирование заказа (Pencil на табе «Инфо») — сохраняет comment/totalAmount/manager.
- Sonner: тосты появляются top-center, тёмная тема, богатые цвета (`richColors`, `theme="dark"`).

### C2. Риски и митигация
- **P2003 (FK violation)** на `newCustomer` — невозможен: `customers` не имеет обязательных FK-связей при insert. Если бэк вернёт 404 — упадёт по иной причине (например, `graveSiteId` несуществующий), м итится существующей обработкой `P2003 → 404`.
- **`managerId: null` в PATCH** — без A-дополнения схема отклонит `null`. Митигировано: добавляем `.nullable()` в `updateOrderBodySchema` (минорное обратно-совместимое изменение).
- **Race condition на автоинкремент `number`** — уже митигирован существующей `prisma.$transaction` + `aggregate _max`; добавление `customer.create` в ту же транзакцию не влияет.
- **Sonner + React 19** — sonner v1.x совместим с React 19 (проверить peer-deps при `npm install`; если конфликт — зафиксировать `sonner@1.5` последней совместимой).
- **Combobox вне viewport** на мобильных Telegram WebApp — список ограничен высотой (`max-h-60 overflow-auto`), z-index высокий, тестируется на dev-сервере.

---

## Резюме изменений
**Бэкенд (3 файла)**: `order.schemas.ts` (+`newCustomerSchema`, `createOrderBodySchema` refactor), `order-repository.ts` (`OrderWriteInput.newCustomer`, `create()` в транзакции создаёт клиента), `order-routes.ts` (проброс `newCustomer`). Плюс минор: `order.schemas.ts` → `managerId: .nullable()` в `updateOrderBodySchema`. **Без миграций БД, без контейнера/DI-изменений.**
**Фронт (7 файлов)**: `package.json` (+`sonner`), `main.tsx` (`<Toaster />`), новые `components/CustomerCombobox.tsx`, `components/LoadingState.tsx`, `components/ErrorState.tsx`, расширенный `components/index.ts`; изменённые `OrdersScreen.tsx` (combobox + режим нового клиента), `CustomersScreen.tsx` (доп. поля), `CustomerDetailScreen.tsx` (редактирование профиля), `OrderDetailScreen.tsx` (редактирование заказа + замена loading/error на компоненты).

**Эффект**: главная «болезнь» UX — «при создании заказа нет клиента под рукой» — закрыта: оператор прямо в форме заказа либо находит клиента поиском по имени/телефону, либо создаёт нового «на лету» одной кнопкой, атомарно. Заодно — редактирование ранее read-only сущностей, доп. поля клиента и глобальная обратная связь через toast.