import {defineType, defineField, defineArrayMember} from 'sanity'
import {SearchIcon} from '@sanity/icons/Search'

/** Per-document SEO. Falls back to siteSettings.defaultSeo on the frontend. */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'title',
      title: 'Meta título',
      type: 'string',
      description: 'Si se deja vacío, se usa el título de la página / ajustes globales.',
      validation: (r) => r.max(70).warning('Recomendado ≤ 70 caracteres'),
    }),
    defineField({
      name: 'description',
      title: 'Meta descripción',
      type: 'text',
      rows: 3,
      validation: (r) => r.max(180).warning('Recomendado ≤ 180 caracteres'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Imagen para compartir (Open Graph)',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'keywords',
      title: 'Palabras clave',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'noIndex',
      title: 'Ocultar a buscadores (noindex)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
