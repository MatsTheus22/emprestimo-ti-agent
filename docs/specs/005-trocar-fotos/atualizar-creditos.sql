-- Spec 005: créditos das 6 fotos trocadas, gerados de skills/imagens-equipamentos/creditos.json.
-- Em produção, só o usuário roda, no SQL Editor, depois de a conferência dar 12 de 12.
-- Uma transação: as 6 linhas ficam com o mesmo updated_at, o now() dela. status e os
-- demais campos não mudam. A consulta da prova está em plan.md.

begin;

update equipment
set photo_source = 'https://pixabay.com/photos/laptop-computer-notebook-2665794/',
    photo_author = 'chapay',
    updated_at = now()
where asset_tag = 'TI-0001'
  and tenant_id = (select id from tenants where slug = 'suporte_ti');

update equipment
set photo_source = 'https://pixabay.com/photos/coffee-caffeine-beverage-table-2425303/',
    photo_author = 'Engin_Akyurt',
    updated_at = now()
where asset_tag = 'TI-0004'
  and tenant_id = (select id from tenants where slug = 'suporte_ti');

update equipment
set photo_source = 'https://pixabay.com/photos/blank-business-computer-desktop-17894/',
    photo_author = 'PublicDomainPictures',
    updated_at = now()
where asset_tag = 'TI-0006'
  and tenant_id = (select id from tenants where slug = 'suporte_ti');

update equipment
set photo_source = 'https://pixabay.com/photos/blank-business-computer-desktop-17768/',
    photo_author = 'PublicDomainPictures',
    updated_at = now()
where asset_tag = 'TI-0007'
  and tenant_id = (select id from tenants where slug = 'suporte_ti');

update equipment
set photo_source = 'https://pixabay.com/photos/high-definition-multimedia-1827/',
    photo_author = 'PublicDomainPictures',
    updated_at = now()
where asset_tag = 'TI-0008'
  and tenant_id = (select id from tenants where slug = 'suporte_ti');

update equipment
set photo_source = 'https://pixabay.com/photos/still-life-camera-notebook-pen-cup-601528/',
    photo_author = 'stokpic',
    updated_at = now()
where asset_tag = 'TI-0012'
  and tenant_id = (select id from tenants where slug = 'suporte_ti');

commit;
