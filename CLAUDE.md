# TEYCA Client Management

## Проект
Frontend-приложение для работы с клиентской базой и PUSH-рассылками через TEYCA API.

## Стек
- Angular 19 (standalone components)
- Angular Material (UI)
- Angular Signals (реактивное состояние)
- TypeScript strict mode
- SCSS

## API
- Авторизация: `POST https://api.teyca.ru/test-auth-only` — любые login/password → тестовый токен
- Основной API: `https://api.teyca.ru/v1/{token}/...`
- Токен передается в URL path и в Authorization header

## Команды
- `ng serve` — запуск dev-сервера
- `ng build` — сборка
- `ng test` — тесты

## Соглашения
- Standalone components (без NgModules)
- Functional guards и interceptors
- Reactive Forms с валидацией
- Signals для состояния (auth, selection)
- Обработка API ошибок через MatSnackBar
- Русскоязычный UI
