import { getUserSession } from '@/lib/utils/token'
import Link from 'next/link'
import { Rocket, CheckCircle2, Settings, Zap, Code2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export async function Hero({
  siteName,
  t,
}: {
  siteName: string
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const session = (await getUserSession()) as { user: { name: string } }

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(74,222,128,0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {session ? (
            <Card className="p-8 lg:p-12 shadow-2xl bg-base-100/95 backdrop-blur-sm border-base-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-linear-to-tr from-secondary/10 to-transparent rounded-tr-full" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success mb-6">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('welcome_back')}</span>
                </div>

                <h2 className="text-3xl lg:text-5xl font-bold mb-6 bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {t('hello', { name: session.user?.name || 'User' })}
                </h2>
                <p className="text-xl text-base-content/70 mb-10 leading-relaxed">
                  {t('logged_in_desc')}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/products">
                    <Button size="lg" className="px-8 gap-2">
                      <Zap className="w-5 h-5" />
                      {t('explore_products')}
                    </Button>
                  </Link>
                  <Link href="/user/settings/profile">
                    <Button variant="outline" size="lg" className="px-8 gap-2">
                      <Settings className="w-5 h-5" />
                      {t('settings')}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-pulse">
                <Rocket className="w-4 h-4" />
                <span className="text-sm font-medium">{t('hero_badge')}</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {t('hero_title')}
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-base-content/70 mb-8 leading-relaxed mx-auto">
                {t('hero_subtitle')}
              </p>

              <p className="text-lg text-base-content/60 mb-12 max-w-2xl mx-auto">
                {t('hero_desc', { siteName })}
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="px-10 gap-2 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Rocket className="w-5 h-5" />
                    {t('get_started')}
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" size="lg" className="px-10 gap-2">
                    <Code2 className="w-5 h-5" />
                    {t('view_products')}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-8 text-sm text-base-content/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{t('feature_badge_1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{t('feature_badge_2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{t('feature_badge_3')}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
