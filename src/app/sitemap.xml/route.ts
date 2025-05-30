// src/app/sitemap.xml/route.ts
import { NextResponse } from 'next/server'

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.resumexpert.info/sitemap-0.xml</loc>
  </sitemap>
</sitemapindex>`

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  })
}
