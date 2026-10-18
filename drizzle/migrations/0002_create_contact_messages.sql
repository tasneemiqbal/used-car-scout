-- Visitors can send one message; nobody can read the table from a browser.
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_name_len CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT contact_messages_email_len CHECK (char_length(email) BETWEEN 3 AND 254),
  CONSTRAINT contact_messages_message_len CHECK (char_length(message) BETWEEN 1 AND 2000)
);

-- Insert only: there is deliberately no SELECT grant or policy for anon/authenticated.
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone may send one message"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 80
    AND char_length(email) BETWEEN 3 AND 254
    AND char_length(message) BETWEEN 1 AND 2000
  );