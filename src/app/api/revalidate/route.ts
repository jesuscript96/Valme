import {revalidatePath} from 'next/cache'
import {type NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

type WebhookPayload = {_type?: string}

/**
 * Sanity webhook → instant revalidation.
 * Configure in Sanity (Manage → API → Webhooks):
 *   URL: https://<tu-dominio>/api/revalidate
 *   Dataset: production · Trigger: create/update/delete
 *   Projection: { "_type": _type }
 *   Secret: SANITY_REVALIDATE_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const {isValidSignature, body} = await parseBody<WebhookPayload>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
    )

    if (!isValidSignature) {
      return new Response('Invalid signature', {status: 401})
    }
    // The whole site shares one root layout and a few global documents, so any
    // publish revalidates every route.
    revalidatePath('/', 'layout')
    return NextResponse.json({revalidated: true, type: body?._type ?? null})
  } catch (err) {
    console.error(err)
    return new Response((err as Error).message, {status: 500})
  }
}
