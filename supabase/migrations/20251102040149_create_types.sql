CREATE TYPE public.log_type AS ENUM (
    'info',
    'error',
    'severe'
);

CREATE TYPE public.mentoring_type AS ENUM (
    'mentor',
    'mentee'
);

CREATE TYPE public.presentation_type AS ENUM (
    '7x7',
    'full length',
    'panel',
    '15 minutes',
    'quiz',
    'session-container'
);

CREATE TYPE public.presenter_info AS (
	id uuid,
	firstname text,
	lastname text
);

CREATE TYPE public.summit_year AS ENUM (
    '2020',
    '2021',
    '2022',
    '2024',
    '2025',
    '2026'
);
