INSERT INTO departments (name) VALUES ('Разработка'), ('HR'), ('Финансы');

INSERT INTO employees (first_name, last_name, position, email, hire_date, department_id) VALUES
    ('Анна',  'Иванова',   'Backend-разработчик',  'anna.ivanova@mycompany.kz',     '2022-03-14', 1),
    ('Павел', 'Смирнов',   'Frontend-разработчик', 'pavel.smirnov@mycompany.kz',    '2023-06-01', 1),
    ('Мария', 'Кузнецова', 'HR-менеджер',          'maria.kuznetsova@mycompany.kz', '2021-09-20', 2),
    ('Игорь', 'Петров',    'Бухгалтер',            'igor.petrov@mycompany.kz',      '2020-01-10', 3);

INSERT INTO courses (title, description, hours) VALUES
    ('Основы PostgreSQL',      'Проектирование схем и SQL-запросы', 16),
    ('Английский B2',          'Деловой английский для сотрудников', 40),
    ('Охрана труда',          'Обязательный вводный курс', 4);

INSERT INTO enrollments (employee_id, course_id, status, score) VALUES
    (1, 1, 'COMPLETED', 92),
    (2, 1, 'ENROLLED',  NULL),
    (3, 3, 'COMPLETED', 100),
    (4, 2, 'DROPPED',   NULL);
