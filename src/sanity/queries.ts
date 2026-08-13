import {defineQuery} from 'next-sanity'

const AREA_CARD = `{
  _id, name, "slug": slug.current, index, eyebrow, icon, tagline, image
}`

export const HOME_QUERY = defineQuery(`{
  "home": *[_id == "homePage"][0]{...},
  "settings": *[_id == "siteSettings"][0]{...},
  "areas": *[_type == "area"] | order(orderRank asc) ${AREA_CARD}
}`)

export const AREA_QUERY = defineQuery(`{
  "area": *[_type == "area" && slug.current == $slug][0]{...},
  "settings": *[_id == "siteSettings"][0]{...},
  "others": *[_type == "area" && slug.current != $slug] | order(orderRank asc){
    _id, name, "slug": slug.current, index
  }
}`)

export const SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]{...}`)

export const AREA_SLUGS_QUERY = defineQuery(`
  *[_type == "area" && defined(slug.current)]{ "slug": slug.current }
`)

export const HOME_SEO_QUERY = defineQuery(`{
  "seo": *[_id == "homePage"][0].seo,
  "settings": *[_id == "siteSettings"][0]{ siteUrl, defaultSeo }
}`)

export const AREA_SEO_QUERY = defineQuery(`{
  "area": *[_type == "area" && slug.current == $slug][0]{ name, tagline, seo },
  "settings": *[_id == "siteSettings"][0]{ siteUrl, defaultSeo }
}`)

export const SITEMAP_QUERY = defineQuery(`{
  "home": *[_id == "homePage"][0]{ _updatedAt, "noIndex": seo.noIndex },
  "areas": *[_type == "area" && defined(slug.current)]{
    "slug": slug.current, _updatedAt, "noIndex": seo.noIndex
  }
}`)
