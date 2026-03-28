-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- 'folder_request', 'new_content', 'announcement', 'file_action'
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (
    (auth.jwt() ->> 'email') = 'thaisverissimomello@gmail.com'
  );

-- Function to notify followers when a new file is uploaded
CREATE OR REPLACE FUNCTION public.notify_new_file()
RETURNS TRIGGER AS $$
DECLARE
  follower RECORD;
  folder_name TEXT;
  course_name TEXT;
BEGIN
  -- Get folder and course name for the notification message
  SELECT f.name, c.name INTO folder_name, course_name
  FROM public.folders f
  JOIN public.courses c ON f.course_id = c.id
  WHERE f.id = NEW.folder_id;

  -- Notify folder followers
  FOR follower IN (SELECT user_id FROM public.folder_favorites WHERE folder_id = NEW.folder_id) LOOP
    INSERT INTO public.notifications (user_id, title, content, type, link)
    VALUES (
      follower.user_id,
      'Novo arquivo em ' || folder_name,
      'Um novo arquivo "' || NEW.name || '" foi adicionado à pasta ' || folder_name || ' em ' || course_name || '.',
      'new_content',
      '/folder/' || NEW.folder_id
    );
  END LOOP;

  -- Notify course followers (optional, but let's do it if they follow the course)
  FOR follower IN (
    SELECT cf.user_id 
    FROM public.course_favorites cf
    JOIN public.folders f ON f.course_id = cf.course_id
    WHERE f.id = NEW.folder_id
    AND cf.user_id NOT IN (SELECT user_id FROM public.folder_favorites WHERE folder_id = NEW.folder_id) -- Avoid duplicate notifications
  ) LOOP
    INSERT INTO public.notifications (user_id, title, content, type, link)
    VALUES (
      follower.user_id,
      'Novo arquivo em ' || course_name,
      'Um novo arquivo "' || NEW.name || '" foi adicionado à pasta ' || folder_name || ' em ' || course_name || '.',
      'new_content',
      '/folder/' || NEW.folder_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new file upload
CREATE TRIGGER on_file_uploaded
  AFTER INSERT ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_file();
