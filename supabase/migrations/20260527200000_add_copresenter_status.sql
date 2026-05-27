ALTER TABLE public.presentation_presenters
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  ADD COLUMN declined_count SMALLINT NOT NULL DEFAULT 0;

-- All existing rows were implicitly accepted
UPDATE public.presentation_presenters SET status = 'accepted';
