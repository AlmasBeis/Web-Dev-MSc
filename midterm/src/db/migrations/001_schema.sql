CREATE TABLE offices (
    id      VARCHAR(10)  PRIMARY KEY,
    city    VARCHAR(100) NOT NULL,
    address VARCHAR(200) NOT NULL
);

CREATE TABLE departments (
    id        VARCHAR(20)  PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    parent_id VARCHAR(20)  REFERENCES departments (id) ON DELETE RESTRICT,
    CONSTRAINT departments_not_self_parent CHECK (parent_id IS DISTINCT FROM id)
);

-- Новые сотрудники получают id вида E15, E16
CREATE SEQUENCE employee_id_seq START 15;

CREATE TABLE employees (
    id              VARCHAR(10)  PRIMARY KEY
                    DEFAULT 'E' || lpad(nextval('employee_id_seq')::text, 2, '0'),
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    middle_name     VARCHAR(50),
    position        VARCHAR(100) NOT NULL,
    department_id   VARCHAR(20)  NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
    manager_id      VARCHAR(10)  REFERENCES employees (id) ON DELETE RESTRICT,
    email           VARCHAR(254) NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    office_id       VARCHAR(10)  NOT NULL REFERENCES offices (id) ON DELETE RESTRICT,
    hire_date       DATE         NOT NULL,
    carry_over_days INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT employees_not_self_manager CHECK (manager_id IS DISTINCT FROM id),
    CONSTRAINT employees_carry_over_range CHECK (carry_over_days BETWEEN 0 AND 60)
);

CREATE UNIQUE INDEX employees_email_unique ON employees (lower(email));
CREATE INDEX employees_department_idx ON employees (department_id);
CREATE INDEX employees_manager_idx ON employees (manager_id);
CREATE INDEX employees_office_idx ON employees (office_id);

CREATE TABLE employee_languages (
    employee_id VARCHAR(10) NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
    language    VARCHAR(50) NOT NULL,
    level       VARCHAR(20) NOT NULL,
    PRIMARY KEY (employee_id, language),
    CONSTRAINT employee_languages_level CHECK (
        level IN ('родной', 'свободно', 'базовый', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    )
);

CREATE TABLE leave_requests (
    id               SERIAL       PRIMARY KEY,
    employee_id      VARCHAR(10)  NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
    approver_id      VARCHAR(10)  NOT NULL REFERENCES employees (id) ON DELETE RESTRICT,
    type             VARCHAR(10)  NOT NULL,
    start_date       DATE         NOT NULL,
    end_date         DATE         NOT NULL,
    substitute_id    VARCHAR(10)  REFERENCES employees (id) ON DELETE SET NULL,
    comment          VARCHAR(300) NOT NULL DEFAULT '',
    status           VARCHAR(10)  NOT NULL DEFAULT 'PENDING',
    created_at       DATE         NOT NULL DEFAULT CURRENT_DATE,
    decided_at       DATE,
    decision_comment VARCHAR(300),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT leave_requests_type   CHECK (type IN ('ANNUAL', 'UNPAID')),
    CONSTRAINT leave_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT leave_requests_period CHECK (end_date >= start_date)
);

CREATE INDEX leave_requests_employee_idx ON leave_requests (employee_id);
CREATE INDEX leave_requests_approver_status_idx ON leave_requests (approver_id, status);
