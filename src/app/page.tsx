import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import Link from 'next/link'
import {
  Rocket,
  ShieldCheck,
  Globe,
  Layout,
  Database,
  CreditCard,
  Palette,
  Mail,
  Download,
  Terminal,
  Settings,
  CheckCircle2,
  Zap,
  Code2,
  Image as Picture,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { siteConfig } from '@/config/site'

export default async function Home() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('home')

  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      {/* Hero Section */}
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
                    {t('hello', { name: session.user.name || 'User' })}
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
                  {t('hero_desc', { siteName: siteConfig.name })}
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

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-base-200/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              {t('features_badge')}
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">{t('features_title')}</h2>
            <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
              {t('features_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              title={t('feature_auth_title')}
              description={t('feature_auth_desc')}
              color="primary"
            />
            <FeatureCard
              icon={<CreditCard className="w-8 h-8" />}
              title={t('feature_payment_title')}
              description={t('feature_payment_desc')}
              color="secondary"
            />
            <FeatureCard
              icon={<Globe className="w-8 h-8" />}
              title={t('feature_i18n_title')}
              description={t('feature_i18n_desc')}
              color="accent"
            />
            <FeatureCard
              icon={<Palette className="w-8 h-8" />}
              title={t('feature_theme_title')}
              description={t('feature_theme_desc')}
              color="info"
            />
            <FeatureCard
              icon={<Database className="w-8 h-8" />}
              title={t('feature_db_title')}
              description={t('feature_db_desc')}
              color="success"
            />
            <FeatureCard
              icon={<Mail className="w-8 h-8" />}
              title={t('feature_email_title')}
              description={t('feature_email_desc')}
              color="warning"
            />
            <FeatureCard
              icon={<Layout className="w-8 h-8" />}
              title={t('feature_ui_title')}
              description={t('feature_ui_desc')}
              color="primary"
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              title={t('feature_admin_title')}
              description={t('feature_admin_desc')}
              color="secondary"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title={t('feature_performance_title')}
              description={t('feature_performance_desc')}
              color="accent"
            />
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
              {t('tech_stack_badge')}
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">{t('tech_stack_title')}</h2>
            <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
              {t('tech_stack_subtitle')}
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Authentication */}
            <TechStackCard
              title={t('tech_auth_title')}
              icon={<ShieldCheck className="w-5 h-5" />}
              items={[
                { name: 'Google OAuth' },
                { name: 'GitHub OAuth' },
                { name: 'Email/Password' },
              ]}
            />

            {/* Payment */}
            <TechStackCard
              title={t('tech_payment_title')}
              icon={<CreditCard className="w-5 h-5" />}
              items={[
                { name: 'Stripe' },
                { name: 'PayPal' },
                { name: 'one-time payment & Subscriptions' },
              ]}
            />

            {/* Email Service */}
            <TechStackCard
              title={t('tech_email_title')}
              icon={<Mail className="w-5 h-5" />}
              items={[{ name: 'Mailgun' }, { name: 'Resend' }, { name: 'Templates' }]}
            />

            {/* Storage */}
            <TechStackCard
              title={t('tech_storage_title')}
              icon={<Picture className="w-5 h-5" />}
              items={[{ name: 'ImgBB' }, { name: 'Local Upload' }, { name: 'CDN Ready' }]}
            />

            {/* Database */}
            <TechStackCard
              title={t('tech_database_title')}
              icon={<Database className="w-5 h-5" />}
              items={[{ name: 'PostgreSQL' }, { name: 'MySQL' }, { name: 'SQLite' }]}
            />

            {/* UI Framework */}
            <TechStackCard
              title={t('tech_ui_title')}
              icon={<Palette className="w-5 h-5" />}
              items={[{ name: 'Tailwind CSS 4' }, { name: 'daisyUI 5' }, { name: 'Responsive' }]}
            />

            {/* i18n */}
            <TechStackCard
              title={t('tech_i18n_title')}
              icon={<Globe className="w-5 h-5" />}
              items={[{ name: 'next-intl' }, { name: 'Multi-language' }, { name: 'Auto-detect' }]}
            />

            {/* DevOps */}
            <TechStackCard
              title={t('tech_devops_title')}
              icon={<Code2 className="w-5 h-5" />}
              items={[{ name: 'TypeScript' }, { name: 'ESLint' }, { name: 'Prisma ORM' }]}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 lg:py-28 bg-base-200/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              {t('guide_badge')}
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">{t('how_it_works_title')}</h2>
            <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
              {t('how_it_works_subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <StepItem
              number="01"
              icon={<Download className="w-6 h-6" />}
              title={t('step_1_title')}
              description={t('step_1_desc')}
              code={
                <>
                  <div>git clone https://github.com/yorsal/tikship.git</div>
                  <div>cd tikship</div>
                  <div>npm install</div>
                </>
              }
            />
            <StepItem
              number="02"
              icon={<Zap className="w-6 h-6" />}
              title={t('step_2_title')}
              description={t('step_2_desc')}
              code="npm run init"
            />
            <StepItem
              number="03"
              icon={<Rocket className="w-6 h-6" />}
              title={t('step_3_title')}
              description={t('step_3_desc')}
              code="npm run dev"
              isLast
            />
          </div>

          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="p-8 bg-linear-to-br from-primary/5 to-secondary/5 border-primary/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Terminal className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{t('auto_install_title')}</h3>
                  <p className="text-base-content/70 mb-4">{t('auto_install_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScriptCard
                  icon={<Rocket className="w-5 h-5" />}
                  title={t('script_install_title')}
                  command="npm run init"
                  description={t('script_install_desc')}
                />
                <ScriptCard
                  icon={<Settings className="w-5 h-5" />}
                  title={t('script_setup_env_title')}
                  command="npm run setup:env"
                  description={t('script_setup_env_desc')}
                />
                <ScriptCard
                  icon={<Database className="w-5 h-5" />}
                  title={t('script_update_db_title')}
                  command="npm run db:update-provider"
                  description={t('script_update_db_desc')}
                />
                <ScriptCard
                  icon={<Zap className="w-5 h-5" />}
                  title={t('script_test_data_title')}
                  command="npm run db:generate-test-data"
                  description={t('script_test_data_desc')}
                />
                <ScriptCard
                  icon={<ShieldCheck className="w-5 h-5" />}
                  title={t('script_reset_pwd_title')}
                  command="npm run reset-admin-password"
                  description={t('script_reset_pwd_desc')}
                />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <Card className="max-w-4xl mx-auto p-8 lg:p-16 text-center shadow-2xl bg-base-100/95 backdrop-blur-sm border-base-300">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">{t('cta_title')}</h2>
            <p className="text-xl text-base-content/70 mb-10 max-w-2xl mx-auto">{t('cta_desc')}</p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="px-10 gap-2 shadow-lg">
                  <Rocket className="w-5 h-5" />
                  {t('cta_button')}
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline" size="lg" className="px-10">
                  {t('learn_more')}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

function ScriptCard({
  icon,
  title,
  command,
  description,
}: {
  icon: React.ReactNode
  title: string
  command: string
  description: string
}) {
  return (
    <div className="p-4 rounded-lg bg-base-100 border border-base-300 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary">{icon}</div>
        <h4 className="font-bold text-sm">{title}</h4>
      </div>
      <code className="block text-xs bg-base-200 px-2 py-1 rounded mb-2 text-primary">
        {command}
      </code>
      <p className="text-xs text-base-content/60">{description}</p>
    </div>
  )
}

function TechStackCard({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: Array<{ name: string }>
}) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-base-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-base-content/70">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span className="text-sm">{item.name}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  color = 'primary',
}: {
  icon: React.ReactNode
  title: string
  description: string
  color?: string
}) {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-base-300 hover:border-primary/30 group h-full">
      <div
        className={`mb-6 p-3 rounded-2xl bg-${color}/10 text-${color} w-fit shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-base-content/60 leading-relaxed">{description}</p>
    </Card>
  )
}

function StepItem({
  number,
  icon,
  title,
  description,
  code,
  isLast = false,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
  code?: string | React.ReactNode
  isLast?: boolean
}) {
  return (
    <div className="flex items-start gap-6 group">
      <div className="shrink-0 relative">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-secondary text-primary-content flex items-center justify-center font-bold text-lg relative z-10 shadow-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {!isLast && (
          <div className="absolute top-16 left-7 w-0.5 h-full bg-linear-to-b from-primary/50 to-transparent" />
        )}
      </div>
      <div className="pt-1 flex-1">
        <div className="text-primary font-bold text-sm mb-2">{number}</div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-base-content/60 text-lg leading-relaxed mb-4">{description}</p>
        {code && (
          <div className="bg-base-200 rounded-lg p-4 text-sm overflow-x-auto border border-base-300">
            <code className="text-primary flex flex-col gap-1">{code}</code>
          </div>
        )}
      </div>
    </div>
  )
}
