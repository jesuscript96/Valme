import {defineType, defineField} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'

/** Reusable call-to-action. `kind` drives what the frontend does on click. */
export const cta = defineType({
  name: 'cta',
  title: 'Botón / CTA',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Texto',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Acción',
      type: 'string',
      options: {
        list: [
          {title: 'Abrir WhatsApp (revisión privada)', value: 'whatsapp'},
          {title: 'Enlace / URL', value: 'url'},
          {title: 'Ir a sección (ancla)', value: 'section'},
        ],
        layout: 'radio',
      },
      initialValue: 'whatsapp',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'href',
      title: 'Destino',
      type: 'string',
      description:
        'Para "Enlace": URL o ruta (p. ej. /areas/...). Para "Sección": el id con # (p. ej. #mandato).',
      hidden: ({parent}) => parent?.kind === 'whatsapp',
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'kind'},
  },
})
