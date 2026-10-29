-- Execute somente no SQL Editor do seu projeto de desenvolvimento,
-- depois de aplicar as migrações e confirmar sua conta pelo login do site.
-- Substitua somente o e-mail abaixo pelo SEU e-mail confirmado.
-- Nenhuma senha ou chave entra neste arquivo.
DO $$
DECLARE
  owner_email text := 'SUBSTITUA_PELO_SEU_EMAIL';
  owner_id uuid;
  ross_id uuid;
BEGIN
  SELECT id INTO owner_id FROM auth.users
    WHERE lower(email) = lower(owner_email) AND email_confirmed_at IS NOT NULL;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Conta confirmada não encontrada. Crie a conta e confirme o e-mail primeiro.';
  END IF;
  INSERT INTO public.tenants (name, slug) VALUES ('Ross Barbearia', 'ross-barbearia')
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO ross_id FROM public.tenants WHERE slug = 'ross-barbearia';
  IF EXISTS (SELECT 1 FROM public.memberships WHERE tenant_id = ross_id AND role = 'owner' AND user_id <> owner_id) THEN
    RAISE EXCEPTION 'Já existe outro proprietário. Nenhum acesso foi alterado.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.memberships WHERE tenant_id = ross_id AND user_id = owner_id AND role <> 'owner') THEN
    RAISE EXCEPTION 'Esta conta já possui outro papel. Revise o vínculo antes de atribuir proprietário.';
  END IF;
  INSERT INTO public.memberships (tenant_id, user_id, role) VALUES (ross_id, owner_id, 'owner')
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
END $$;
