import {defineType, defineField, defineArrayMember} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'

const heading = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    options: {columns: 2},
    fields: [
      defineField({name: 'lead', title: 'Texto', type: 'string'}),
      defineField({name: 'dim', title: 'Parte atenuada (gris)', type: 'string', description: 'Se muestra en gris al final del titular.'}),
    ],
  })

/** The home page (singleton) — one collapsible object per section. */
export const homePage = defineType({
  name: 'homePage',
  title: 'Página de inicio',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'mission', title: 'Tesis'},
    {name: 'symptoms', title: 'Síntomas'},
    {name: 'areas', title: 'Intervención'},
    {name: 'method', title: 'Metodología'},
    {name: 'mandates', title: 'Mandatos'},
    {name: 'admission', title: 'Admisión'},
    {name: 'firm', title: 'Firma'},
    {name: 'contact', title: 'Contacto'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // HERO
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'titleLine1', title: 'Título — línea 1', type: 'string'}),
        defineField({name: 'titleLine2', title: 'Título — línea 2', type: 'string'}),
        defineField({name: 'subtitle', title: 'Subtítulo', type: 'string'}),
        defineField({name: 'paragraph', title: 'Párrafo', type: 'text', rows: 3}),
        defineField({name: 'primaryCta', title: 'CTA principal', type: 'cta'}),
        defineField({name: 'secondaryCta', title: 'CTA secundario', type: 'cta'}),
        defineField({name: 'mediaUrl', title: 'Vídeo de fondo (URL)', type: 'string', description: 'Ruta del vídeo. Por defecto /assets/ValmeSolutionsVideo.webm'}),
      ],
    }),

    // TESIS
    defineField({
      name: 'mission',
      title: 'Tesis',
      type: 'object',
      group: 'mission',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        heading('heading', 'Titular'),
        defineField({name: 'lead', title: 'Párrafo', type: 'text', rows: 4}),
        defineField({name: 'principlesEyebrow', title: 'Eyebrow de principios', type: 'string'}),
        defineField({
          name: 'principles',
          title: 'Principios',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({name: 'id', title: 'Nº', type: 'string'}),
                defineField({name: 'title', title: 'Título', type: 'string'}),
                defineField({name: 'body', title: 'Texto', type: 'text', rows: 3}),
              ],
              preview: {select: {title: 'title', subtitle: 'id'}},
            }),
          ],
        }),
      ],
    }),

    // SÍNTOMAS
    defineField({
      name: 'symptoms',
      title: 'Síntomas',
      type: 'object',
      group: 'symptoms',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        heading('heading', 'Titular'),
        defineField({
          name: 'items',
          title: 'Síntomas',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({name: 'label', title: 'Etiqueta (pestaña)', type: 'string'}),
                defineField({name: 'statement', title: 'Afirmación', type: 'text', rows: 2}),
                defineField({name: 'detail', title: 'Detalle', type: 'text', rows: 3}),
              ],
              preview: {select: {title: 'label', subtitle: 'statement'}},
            }),
          ],
        }),
      ],
    }),

    // INTERVENCIÓN (áreas)
    defineField({
      name: 'areasSection',
      title: 'Intervención',
      type: 'object',
      group: 'areas',
      description: 'Las 4 tarjetas se toman de los documentos "Área de intervención".',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        heading('heading', 'Titular'),
        defineField({name: 'intro', title: 'Introducción', type: 'text', rows: 3}),
        defineField({name: 'closingEyebrow', title: 'Eyebrow del bloque de cierre', type: 'string'}),
        defineField({name: 'closingHeading', title: 'Titular del bloque de cierre', type: 'string'}),
        defineField({name: 'closingCta', title: 'CTA del bloque de cierre', type: 'cta'}),
      ],
    }),

    // METODOLOGÍA (mandato)
    defineField({
      name: 'methodology',
      title: 'Metodología',
      type: 'object',
      group: 'method',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        heading('heading', 'Titular'),
        defineField({name: 'lead', title: 'Párrafo', type: 'text', rows: 2}),
        defineField({name: 'leadMono', title: 'Texto mono destacado', type: 'string', description: 'Ej.: The Valme Mandate'}),
        defineField({
          name: 'steps',
          title: 'Fases',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({name: 'id', title: 'Nº', type: 'string'}),
                defineField({name: 'name', title: 'Nombre', type: 'string'}),
                defineField({name: 'description', title: 'Descripción', type: 'text', rows: 3}),
                defineField({name: 'image', title: 'Imagen', type: 'image', options: {hotspot: true}}),
              ],
              preview: {select: {title: 'name', subtitle: 'id', media: 'image'}},
            }),
          ],
        }),
      ],
    }),

    // MANDATOS
    defineField({
      name: 'mandates',
      title: 'Mandatos',
      type: 'object',
      group: 'mandates',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        heading('heading', 'Titular'),
        defineField({name: 'lead', title: 'Párrafo', type: 'text', rows: 2}),
        defineField({name: 'footnote', title: 'Nota al pie', type: 'string'}),
        defineField({
          name: 'plans',
          title: 'Planes',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({name: 'index', title: 'Índice (M/01…)', type: 'string'}),
                defineField({name: 'name', title: 'Nombre', type: 'string'}),
                defineField({name: 'pitch', title: 'Descripción', type: 'text', rows: 3}),
                defineField({name: 'includes', title: 'Incluye', type: 'array', of: [defineArrayMember({type: 'string'})]}),
                defineField({name: 'ctaLabel', title: 'Texto del CTA', type: 'string'}),
                defineField({name: 'variant', title: 'Variante', type: 'string', options: {list: ['light', 'dark'], layout: 'radio'}, initialValue: 'light'}),
              ],
              preview: {select: {title: 'name', subtitle: 'index'}},
            }),
          ],
        }),
      ],
    }),

    // ADMISIÓN
    defineField({
      name: 'admission',
      title: 'Admisión',
      type: 'object',
      group: 'admission',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Titular', type: 'text', rows: 2}),
        defineField({name: 'intro', title: 'Párrafo', type: 'text', rows: 3}),
        defineField({name: 'notAcceptedTitle', title: 'Título "No aceptamos"', type: 'string'}),
        defineField({name: 'notAccepted', title: 'No aceptamos', type: 'array', of: [defineArrayMember({type: 'string'})]}),
        defineField({name: 'acceptedTitle', title: 'Título "Trabajamos cuando"', type: 'string'}),
        defineField({name: 'accepted', title: 'Trabajamos cuando', type: 'array', of: [defineArrayMember({type: 'string'})]}),
      ],
    }),

    // FIRMA
    defineField({
      name: 'firm',
      title: 'Firma',
      type: 'object',
      group: 'firm',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        heading('heading', 'Titular'),
        defineField({
          name: 'proof',
          title: 'Pruebas',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({name: 'tag', title: 'Nº', type: 'string'}),
                defineField({name: 'label', title: 'Título', type: 'string'}),
                defineField({name: 'body', title: 'Texto', type: 'text', rows: 3}),
              ],
              preview: {select: {title: 'label', subtitle: 'tag'}},
            }),
          ],
        }),
        defineField({name: 'statement', title: 'Declaración', type: 'text', rows: 2}),
        defineField({name: 'statementSub', title: 'Subdeclaración', type: 'text', rows: 3}),
      ],
    }),

    // CONTACTO
    defineField({
      name: 'contact',
      title: 'Contacto',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Titular', type: 'text', rows: 2}),
        defineField({name: 'paragraph', title: 'Párrafo', type: 'text', rows: 3}),
        defineField({name: 'cta', title: 'CTA', type: 'cta'}),
        defineField({name: 'footnote', title: 'Nota al pie', type: 'string'}),
      ],
    }),

    // SEO
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Página de inicio'})},
})
