-- MangoCycle B2: the Auth trigger runs internally and must not be an exposed RPC.
revoke all on function public.handle_new_user() from public, anon, authenticated;
