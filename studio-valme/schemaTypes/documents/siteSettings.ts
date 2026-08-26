import {defineType, defineField, defineArrayMember} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

/** Global, site-wide settings (singleton). */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Ajustes del sitio',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'brand', title: 'Marca', default: true},
    {name: 'contact', title: 'Contacto'},
    {name: 'nav', title: 'Navegación'},
    {name: 'footer', title: 'Footer'},
    {name: 'areaPage', title: 'Páginas de área'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // Marca
    defineField({name: 'brandName', title: 'Nombre de marca', type: 'string', group: 'brand', initialValue: 'Valme'}),
    defineField({name: 'descriptor', title: 'Descriptor', type: 'string', group: 'brand', description: 'Private Operations Firm'}),
    defineField({name: 'logo', title: 'Logo', type: 'image', group: 'brand', options: {hotspot: false}}),

    // Contacto
    defineField({name: 'whatsappNumber', title: 'Número WhatsApp', type: 'string', group: 'contact', description: 'Solo dígitos, con prefijo. P. ej. 34600412492'}),
    defineField({name: 'whatsappMessage', title: 'Mensaje WhatsApp por defecto', type: 'text', rows: 2, group: 'contact'}),
    defineField({name: 'email', title: 'Email', type: 'string', group: 'contact'}),
    defineField({name: 'linkedinUrl', title: 'LinkedIn', type: 'url', group: 'contact'}),
    defineField({name: 'siteUrl', title: 'URL del sitio', type: 'url', group: 'contact', initialValue: 'https://www.valmesolutions.com'}),

    // Navegación
    defineField({
      name: 'navLinks',
      title: 'Enlaces de navegación',
      type: 'array',
      group: 'nav',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Texto', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'sectionId', title: 'Id de sección', type: 'string', description: 'Sin # (p. ej. tesis, mandato, contacto).', validation: (r) => r.required()}),
          ],
          preview: {select: {title: 'label', subtitle: 'sectionId'}},
        }),
      ],
    }),
    defineField({name: 'navCtaLabel', title: 'Texto del botón de la barra', type: 'string', group: 'nav', initialValue: 'Revisión privada'}),

    // Footer
    defineField({name: 'footerLegal', title: 'Texto legal', type: 'text', rows: 3, group: 'footer'}),
    defineField({
      name: 'footerColumns',
      title: 'Columnas del footer',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Título', type: 'string'}),
            defineField({
              name: 'links',
              title: 'Enlaces',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [
                    defineField({name: 'label', title: 'Texto', type: 'string'}),
                    defineField({name: 'href', title: 'Destino', type: 'string', description: 'Ruta o #ancla.'}),
                  ],
                  preview: {select: {title: 'label', subtitle: 'href'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),

    // Páginas de área — "The Valme Mandate"
    defineField({name: 'areaMandateEyebrow', title: 'Eyebrow del mandato (área)', type: 'string', group: 'areaPage', initialValue: '/ The Valme Mandate'}),
    defineField({
      name: 'areaMandateSteps',
      title: 'Fases del mandato (páginas de área)',
      type: 'array',
      group: 'areaPage',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'step', title: 'Nº', type: 'string'}),
            defineField({name: 'title', title: 'Título', type: 'string'}),
            defineField({name: 'body', title: 'Texto', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title', subtitle: 'step'}},
        }),
      ],
    }),
    defineField({name: 'areaScenariosNote', title: 'Nota de escenarios', type: 'text', rows: 2, group: 'areaPage', description: 'Aviso bajo los escenarios de cada área.'}),

    // SEO por defecto
    defineField({name: 'defaultSeo', title: 'SEO por defecto', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Ajustes del sitio'})},
})
