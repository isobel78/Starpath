CREATE OR REPLACE FUNCTION public.cleanup_user_course_enrollments() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.enrollments WHERE course_id = OLD.id AND user_id = OLD.user_id AND completed_at IS NULL;
  RETURN OLD;
END $$;
REVOKE EXECUTE ON FUNCTION public.cleanup_user_course_enrollments() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER user_courses_cleanup_enrollments AFTER DELETE ON public.user_courses FOR EACH ROW EXECUTE FUNCTION public.cleanup_user_course_enrollments();