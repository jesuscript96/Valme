import type {StructureResolver} from 'sanity/structure'
import {CogIcon} from '@sanity/icons/Cog'
import {HomeIcon} from '@sanity/icons/Home'
import {ComponentIcon} from '@sanity/icons/Component'

const SINGLETONS = ['siteSettings', 'homePage']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenido')
    .items([
      S.listItem()
        .title('Ajustes del sitio')
        .icon(CogIcon)
        .child(
          S.document().schemaType('siteSettings').documentId('siteSettings').title('Ajustes del sitio'),
        ),
      S.listItem()
        .title('Página de inicio')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage').title('Página de inicio')),
      S.divider(),
      S.documentTypeListItem('area').title('Áreas de intervención').icon(ComponentIcon),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (li) => ![...SINGLETONS, 'area'].includes(li.getId() as string),
      ),
    ])
