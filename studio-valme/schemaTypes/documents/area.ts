import {defineType, defineField, defineArrayMember} from 'sanity'
import {ComponentIcon} from '@sanity/icons/Component'

/** One of the four intervention areas (Revenue / Internal / Administrative / Executive). */
export const area = defineType({
  name: 'area',
  title: 'Área de intervención',
  type: 'document',
  icon: ComponentIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'index',
      title: 'Índice (01–04)',
      type: 'string',
      description: 'Se muestra como /01, /02…',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'orderRank',
      title: 'Orden',
      type: 'number',
      description: 'Orden en el que aparecen las áreas (1–4).',
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Etiqueta corta (Ingresos, Operación…).',
    }),
    defineField({
      name: 'icon',
      title: 'Icono',
      type: 'string',
      options: {
        list: [
          {title: 'Ingresos (TrendingUp)', value: 'trending-up'},
          {title: 'Operación (Workflow)', value: 'workflow'},
          {title: 'Administración (FileStack)', value: 'file-stack'},
          {title: 'Dirección (Activity)', value: 'activity'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'text',
      rows: 2,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Introducción',
      type: 'text',
      rows: 4,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagen',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'cases',
      title: 'Escenarios',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Título', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'description', title: 'Descripción', type: 'text', rows: 3, validation: (r) => r.required()}),
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        }),
      ],
    }),
    defineField({
      name: 'benefits',
      title: 'Resultados de la intervención',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Título', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'detail', title: 'Detalle', type: 'text', rows: 2, validation: (r) => r.required()}),
          ],
          preview: {select: {title: 'label', subtitle: 'detail'}},
        }),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  orderings: [
    {title: 'Orden', name: 'orderAsc', by: [{field: 'orderRank', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name', subtitle: 'eyebrow', index: 'index'},
    prepare: ({title, subtitle, index}) => ({title: `${index ? index + ' · ' : ''}${title}`, subtitle}),
  },
})
