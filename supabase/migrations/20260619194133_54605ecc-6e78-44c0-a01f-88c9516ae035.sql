
DROP POLICY IF EXISTS "Insert any notification (server)" ON public.notifications;
CREATE POLICY "Auth users insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
