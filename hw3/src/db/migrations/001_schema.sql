CREATE TABLE departments (
    id   SERIAL       PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE employees (
    id            SERIAL       PRIMARY KEY,
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    position      VARCHAR(100) NOT NULL,
    email         VARCHAR(254) NOT NULL UNIQUE,
    hire_date     DATE         NOT NULL,
    department_id INTEGER      NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX employees_department_idx ON employees (department_id);

CREATE TABLE courses (
    id          SERIAL       PRIMARY KEY,
    title       VARCHAR(150) NOT NULL UNIQUE,
    description VARCHAR(500) NOT NULL DEFAULT '',
    hours       INTEGER      NOT NULL CHECK (hours BETWEEN 1 AND 500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);


CREATE TABLE enrollments (
    id          SERIAL      PRIMARY KEY,
    employee_id INTEGER     NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
    course_id   INTEGER     NOT NULL REFERENCES courses (id)   ON DELETE RESTRICT,
    status      VARCHAR(10) NOT NULL DEFAULT 'ENROLLED',
    score       INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT enrollments_status CHECK (status IN ('ENROLLED', 'COMPLETED', 'DROPPED')),
    CONSTRAINT enrollments_score  CHECK (score IS NULL OR (score BETWEEN 0 AND 100 AND status = 'COMPLETED')),
    CONSTRAINT enrollments_unique UNIQUE (employee_id, course_id)
);
CREATE INDEX enrollments_course_idx ON enrollments (course_id);
