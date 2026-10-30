ALTER TABLE employee_languages ADD COLUMN sort_order SMALLINT NOT NULL DEFAULT 0;

UPDATE employee_languages l
SET sort_order = s.rn
FROM (
    SELECT ctid AS row_id,
           row_number() OVER (PARTITION BY employee_id ORDER BY ctid) - 1 AS rn
    FROM employee_languages
) s
WHERE l.ctid = s.row_id;
