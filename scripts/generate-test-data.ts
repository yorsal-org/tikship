/**
 * Test Data Generator Script
 * Generates realistic mock data that satisfies validation requirements
 * Run with: npm run db:generate-test-data
 */

// Load environment variables first
import 'dotenv/config'
import { PrismaClient } from '../prisma/generated/client'
import { hashPassword } from '../src/lib/auth/password'
import { validationConfig } from '../src/config/validation'

// Initialize Prisma Client with adapter
const DATABASE_URL = process.env.DATABASE_URL || ''

console.log(
  '📌 Database URL:',
  DATABASE_URL ? DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'Not set'
)

const getAdapter = async () => {
  if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
    const [{ PrismaPg }, { Pool }] = await Promise.all([import('@prisma/adapter-pg'), import('pg')])
    const pool = new Pool({ connectionString: DATABASE_URL })
    return new PrismaPg(pool)
  }

  if (DATABASE_URL.startsWith('mysql://')) {
    const { PrismaMariaDb } = await import('@prisma/adapter-mariadb')
    return new PrismaMariaDb(DATABASE_URL)
  }

  if (DATABASE_URL.startsWith('file:') || DATABASE_URL.includes('.db')) {
    const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3')
    const sqlitePath = DATABASE_URL.startsWith('file:')
      ? DATABASE_URL.replace('file:', '')
      : DATABASE_URL
    return new PrismaBetterSqlite3({ url: sqlitePath })
  }

  throw new Error('Unsupported database URL format')
}

const adapter = await getAdapter()
const prisma = new PrismaClient({ adapter } as never)

// Utility functions for generating realistic data
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const randomElement = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)]

const randomElements = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Realistic data pools
const FIRST_NAMES = [
  'Emma',
  'Liam',
  'Olivia',
  'Noah',
  'Ava',
  'Ethan',
  'Sophia',
  'Mason',
  'Isabella',
  'William',
  'Mia',
  'James',
  'Charlotte',
  'Benjamin',
  'Amelia',
  'Lucas',
  'Harper',
  'Henry',
  'Evelyn',
  'Alexander',
  'Abigail',
  'Michael',
  'Emily',
  'Daniel',
  'Elizabeth',
  'Matthew',
  'Sofia',
  'Jackson',
  'Avery',
  'Sebastian',
  'Ella',
  'Jack',
  'Scarlett',
  'Aiden',
  'Grace',
  'Owen',
  'Chloe',
]

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Thompson',
  'White',
  'Harris',
  'Clark',
  'Lewis',
  'Robinson',
  'Walker',
]

const EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'aol.com',
  'zoho.com',
  'fastmail.com',
]

const COMPANY_NAMES = [
  'TechCorp',
  'InnovateLabs',
  'DataSystems',
  'CloudWorks',
  'DevHub',
  'CodeFactory',
  'DigitalEdge',
  'SmartSolutions',
  'NextGen',
  'FutureTech',
  'WebMasters',
  'AppBuilders',
  'SoftwareHouse',
  'TechVentures',
  'ByteWorks',
]

const PRODUCT_NAMES = [
  'Starter Plan',
  'Professional Plan',
  'Enterprise Plan',
  'Premium Subscription',
  'Basic Package',
  'Advanced Package',
  'Ultimate Package',
  'Monthly Membership',
  'Annual Membership',
  'Lifetime Access',
  'Pro Edition',
  'Business Edition',
  'Team License',
  'Individual License',
  'Corporate License',
]

const PRODUCT_CONTENT_TEMPLATES = [
  `<h2>Product Overview</h2><p>This comprehensive solution is designed to meet the needs of modern businesses and individuals seeking excellence in their operations.</p><h2>Key Features</h2><ul><li>Advanced analytics and reporting capabilities</li><li>24/7 customer support with dedicated account manager</li><li>Seamless integration with popular tools and platforms</li><li>Regular updates and new feature releases</li><li>Enterprise-grade security and compliance</li></ul><h2>What's Included</h2><p>Get access to our full suite of tools and resources, including premium templates, exclusive content, and priority support. Everything you need to succeed is at your fingertips.</p><h2>Perfect For</h2><p>Ideal for professionals, teams, and organizations looking to streamline their workflow and boost productivity. Whether you're a startup or an established enterprise, this plan scales with your needs.</p><h2>Getting Started</h2><p>Sign up today and get instant access to all features. Our onboarding team will guide you through the setup process to ensure you're up and running in no time.</p>`,
  
  `<h2>Why Choose This Plan?</h2><p>Experience the power of cutting-edge technology combined with intuitive design. Our platform has helped thousands of users achieve their goals faster and more efficiently.</p><h2>Core Benefits</h2><ul><li>Unlimited storage and bandwidth</li><li>Advanced collaboration tools for teams</li><li>Custom branding and white-label options</li><li>API access for custom integrations</li><li>Detailed usage analytics and insights</li></ul><h2>Technical Specifications</h2><p>Built on a robust infrastructure that ensures 99.9% uptime. Our platform leverages the latest cloud technologies to deliver exceptional performance and reliability.</p><h2>Support & Training</h2><p>Access our comprehensive knowledge base, video tutorials, and live training sessions. Our support team is available around the clock to assist you with any questions.</p><h2>Money-Back Guarantee</h2><p>Try risk-free with our 30-day money-back guarantee. If you're not completely satisfied, we'll refund your purchase—no questions asked.</p>`,
  
  `<h2>Transform Your Workflow</h2><p>Discover a smarter way to work with our all-in-one solution. Designed by experts, trusted by industry leaders worldwide.</p><h2>Premium Features</h2><ul><li>AI-powered automation and smart workflows</li><li>Real-time collaboration with team members</li><li>Advanced security with SSO and 2FA</li><li>Customizable dashboards and reports</li><li>Priority feature requests and roadmap input</li></ul><h2>Integration Ecosystem</h2><p>Connect seamlessly with over 100+ popular apps and services. From CRM systems to project management tools, we've got you covered with native integrations and webhooks.</p><h2>Scalability</h2><p>Start small and grow without limits. Our infrastructure automatically scales to handle your increasing demands, ensuring consistent performance at any size.</p><h2>Success Stories</h2><p>Join thousands of satisfied customers who have transformed their business with our platform. See measurable results within the first month of implementation.</p>`,
  
  `<h2>Unlock Your Potential</h2><p>Take your productivity to the next level with our feature-rich platform. Everything you need, nothing you don't.</p><h2>What You Get</h2><ul><li>Full access to all current and future features</li><li>Dedicated account manager for personalized support</li><li>Custom onboarding and training sessions</li><li>Priority bug fixes and feature development</li><li>Exclusive access to beta features and early releases</li></ul><h2>Security First</h2><p>Your data security is our top priority. We employ bank-level encryption, regular security audits, and comply with GDPR, SOC 2, and ISO 27001 standards.</p><h2>Performance Metrics</h2><p>Track your success with detailed analytics and reporting. Monitor key performance indicators, generate custom reports, and make data-driven decisions with confidence.</p><h2>Community Access</h2><p>Join our thriving community of users. Share best practices, get inspired by others, and participate in exclusive events and webinars.</p>`,
  
  `<h2>The Complete Solution</h2><p>Everything you need in one powerful package. Streamline operations, reduce costs, and drive growth with our comprehensive platform.</p><h2>Advanced Capabilities</h2><ul><li>Multi-language support for global teams</li><li>Advanced permission controls and user management</li><li>Automated workflows and task scheduling</li><li>Custom fields and flexible data structures</li><li>Export and backup tools for data portability</li></ul><h2>Mobile Experience</h2><p>Work from anywhere with our fully-featured mobile apps for iOS and Android. Stay connected and productive whether you're in the office or on the go.</p><h2>Compliance & Certifications</h2><p>Rest easy knowing we meet the highest industry standards. Our platform is certified for HIPAA, PCI DSS, and other critical compliance frameworks.</p><h2>Upgrade Anytime</h2><p>Need more power? Upgrade or downgrade your plan at any time with no penalties. We offer flexible billing options to match your business needs.</p>`,
]

const ARTICLE_TITLES = [
  'Getting Started with Modern Web Development',
  'Best Practices for API Design',
  'Understanding Database Optimization',
  'The Future of Cloud Computing',
  'Building Scalable Applications',
  'Introduction to Microservices Architecture',
  'Security Best Practices for Web Apps',
  'Performance Optimization Techniques',
  'Modern JavaScript Frameworks Comparison',
  'DevOps Essentials for Developers',
  'Mastering TypeScript in 2026',
  'Building RESTful APIs with Node.js',
  'GraphQL vs REST: Which to Choose?',
  'Container Orchestration with Kubernetes',
  'Serverless Architecture Explained',
  'CI/CD Pipeline Best Practices',
  'Testing Strategies for Modern Apps',
  'Authentication and Authorization Guide',
  'Database Design Patterns',
  'Monitoring and Logging Best Practices',
]

const ARTICLE_CONTENT_TEMPLATES = [
  `<h2>Introduction</h2><p>In this comprehensive guide, we'll explore the fundamental concepts and best practices that every developer should know.</p><h2>Key Concepts</h2><p>Understanding the core principles is essential for building robust and maintainable applications. Let's dive into the details.</p><h2>Implementation</h2><p>Here's how you can implement these concepts in your projects with practical examples and code snippets.</p><h2>Best Practices</h2><p>Following industry standards and best practices will help you create better software that stands the test of time.</p><h2>Conclusion</h2><p>By applying these techniques, you'll be well-equipped to tackle complex challenges in modern software development.</p>`,
  `<h2>Overview</h2><p>This article provides an in-depth look at advanced techniques and methodologies used by industry professionals.</p><h2>Background</h2><p>Before we begin, it's important to understand the historical context and evolution of these approaches.</p><h2>Technical Details</h2><p>Let's examine the technical implementation details and architectural considerations you need to be aware of.</p><h2>Real-world Examples</h2><p>We'll look at several case studies from successful companies that have implemented these strategies.</p><h2>Summary</h2><p>These insights will help you make informed decisions when designing your next project.</p>`,
  `<h2>Getting Started</h2><p>Welcome to this tutorial where we'll walk through everything you need to know step by step.</p><h2>Prerequisites</h2><p>Make sure you have the necessary tools and knowledge before proceeding with the implementation.</p><h2>Step-by-Step Guide</h2><p>Follow these detailed instructions to achieve the desired results in your development workflow.</p><h2>Troubleshooting</h2><p>Common issues and their solutions are covered here to help you overcome potential obstacles.</p><h2>Next Steps</h2><p>Continue your learning journey with these recommended resources and advanced topics.</p>`,
]

// Hierarchical category definitions (max 3 levels)
const CATEGORY_TREE = [
  {
    name: 'Technology',
    description: 'Latest technology trends and innovations',
    children: [
      {
        name: 'Cloud Computing',
        description: 'Cloud platforms and infrastructure',
        children: [
          { name: 'AWS', description: 'Amazon Web Services tutorials' },
          { name: 'Azure', description: 'Microsoft Azure guides' },
          { name: 'GCP', description: 'Google Cloud Platform' },
        ],
      },
      {
        name: 'AI & ML',
        description: 'Artificial Intelligence and Machine Learning',
        children: [
          { name: 'Deep Learning', description: 'Neural networks and deep learning' },
          { name: 'NLP', description: 'Natural language processing' },
        ],
      },
    ],
  },
  {
    name: 'Development',
    description: 'Software development tutorials and guides',
    children: [
      {
        name: 'Frontend',
        description: 'Frontend development and UI frameworks',
        children: [
          { name: 'React', description: 'React.js development' },
          { name: 'Vue', description: 'Vue.js development' },
          { name: 'CSS & Design', description: 'Styling and design systems' },
        ],
      },
      {
        name: 'Backend',
        description: 'Server-side development and APIs',
        children: [
          { name: 'Node.js', description: 'Node.js and Express' },
          { name: 'Databases', description: 'SQL and NoSQL databases' },
        ],
      },
      {
        name: 'DevOps',
        description: 'DevOps practices and automation',
        children: [
          { name: 'CI/CD', description: 'Continuous integration and delivery' },
          { name: 'Containers', description: 'Docker and Kubernetes' },
        ],
      },
    ],
  },
  {
    name: 'Business',
    description: 'Business strategies and entrepreneurship',
    children: [
      {
        name: 'Marketing',
        description: 'Digital marketing and growth strategies',
        children: [
          { name: 'SEO', description: 'Search engine optimization' },
          { name: 'Content Marketing', description: 'Content strategy and creation' },
        ],
      },
      {
        name: 'Security',
        description: 'Cybersecurity and data protection',
        children: [
          { name: 'Web Security', description: 'Web application security' },
          { name: 'Compliance', description: 'Security standards and compliance' },
        ],
      },
    ],
  },
]

const TAG_NAMES = [
  'javascript',
  'typescript',
  'react',
  'nodejs',
  'python',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'mongodb',
  'postgresql',
  'redis',
  'graphql',
  'rest-api',
  'microservices',
  'serverless',
  'devops',
  'ci-cd',
  'testing',
  'security',
  'performance',
  'scalability',
]

// Generate realistic user data
const generateUser = async () => {
  const firstName = randomElement(FIRST_NAMES)
  const lastName = randomElement(LAST_NAMES)
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomInt(1, 999)}`
  const email = `${username}@${randomElement(EMAIL_DOMAINS)}`
  const password = await hashPassword('User123!')

  return {
    name: `${firstName} ${lastName}`,
    email,
    password,
    emailVerified: Math.random() > 0.3 ? new Date() : null,
    isActive: Math.random() > 0.1,
    lastLoginAt:
      Math.random() > 0.2 ? new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000) : null,
  }
}

// Generate realistic admin user data
const generateAdminUser = (index: number) => {
  const firstName = randomElement(FIRST_NAMES)
  const lastName = randomElement(LAST_NAMES)
  const username = `admin_${firstName.toLowerCase()}_${lastName.toLowerCase()}_${index}`
  const email = `${username}@${randomElement(COMPANY_NAMES).toLowerCase()}.com`

  return {
    username: username.substring(0, validationConfig.user.username.maxLength),
    email: email.substring(0, validationConfig.user.email.maxLength),
    name: `${firstName} ${lastName}`.substring(0, validationConfig.user.name.maxLength),
    isSuperuser: index === 0,
    isActive: Math.random() > 0.05,
    lastLoginAt:
      Math.random() > 0.1 ? new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000) : null,
  }
}

// Generate realistic product data
const generateProduct = (index: number) => {
  const name = randomElement(PRODUCT_NAMES)
  const currencies = ['usd', 'eur', 'cny', 'gbp']
  
  const prices = [999, 1999, 4999, 9999, 19999, 49999, 99900]

  // Use Unsplash images for products
  const productImages = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop',
  ]

  const productImage = productImages[index % productImages.length]
  const slug = `${generateSlug(name)}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  const content = randomElement(PRODUCT_CONTENT_TEMPLATES)

  return {
    name: name.substring(0, validationConfig.product.name.maxLength),
    description:
      `${name} includes all essential features. Perfect for ${randomElement(['individuals', 'teams', 'businesses', 'enterprises'])}.`.substring(
        0,
        validationConfig.product.description.maxLength
      ),
    content,
    slug,
    image: productImage,
    price: randomElement(prices),
    currency: randomElement(currencies),
    quantity: Math.random() > 0.3 ? randomInt(5, 100) : null, // null = unlimited
    isActive: Math.random() > 0.2,
    metadata: JSON.stringify({
      features: randomElements(
        ['Feature A', 'Feature B', 'Feature C', 'Feature D'],
        randomInt(2, 4)
      ),
      popular: Math.random() > 0.7,
    }),
  }
}

// Generate payment method for a product
const generatePaymentMethod = (productId: string, provider: 'stripe' | 'paypal') => {
  const modes = ['payment', 'subscription']
  const mode = randomElement(modes)
  const intervals = ['month', 'year', 'week', 'day']

  if (provider === 'stripe') {
    return {
      productId,
      provider: 'stripe',
      stripePriceId: `price_${Math.random().toString(36).substring(2, 15)}`,
      stripeProductId: Math.random() > 0.5 ? `prod_${Math.random().toString(36).substring(2, 15)}` : null,
      paypalPlanId: null,
      paypalProductId: null,
      mode,
      interval: mode === 'subscription' ? randomElement(intervals) : null,
      intervalCount: mode === 'subscription' ? randomElement([1, 3, 6, 12]) : null,
      isActive: Math.random() > 0.1,
      metadata: null,
    }
  } else {
    return {
      productId,
      provider: 'paypal',
      stripePriceId: null,
      stripeProductId: null,
      paypalPlanId: mode === 'subscription' ? `P-${Math.random().toString(36).substring(2, 15).toUpperCase()}` : null,
      paypalProductId: Math.random() > 0.5 ? `PROD-${Math.random().toString(36).substring(2, 15).toUpperCase()}` : null,
      mode,
      interval: mode === 'subscription' ? randomElement(intervals) : null,
      intervalCount: mode === 'subscription' ? randomElement([1, 3, 6, 12]) : null,
      isActive: Math.random() > 0.1,
      metadata: null,
    }
  }
}

// Generate realistic article/post data
const generatePost = (authorId: string, type: 'ARTICLE' | 'PAGE', index: number) => {
  const title =
    type === 'ARTICLE'
      ? randomElement(ARTICLE_TITLES)
      : `About ${randomElement(['Us', 'Our Mission', 'Our Team', 'Privacy Policy', 'Terms of Service'])}`

  // Add timestamp and random string to ensure absolutely unique slugs
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const slug = `${generateSlug(title)}-${timestamp}-${randomStr}`
  const content = randomElement(ARTICLE_CONTENT_TEMPLATES)
  const statuses = ['DRAFT', 'PUBLISHED', 'SCHEDULED']
  const status = randomElement(statuses)

  // Use Unsplash random images for articles (tech/coding themed)
  const imageId = 2000 + index
  const articleImage =
    type === 'ARTICLE' ? `https://picsum.photos/seed/article${imageId}/1200/630` : null

  return {
    title: title.substring(0, validationConfig.post.title.maxLength),
    slug: slug.substring(0, validationConfig.post.slug.maxLength),
    content,
    excerpt: `${title.substring(0, 100)}...`.substring(0, validationConfig.post.excerpt.maxLength),
    featuredImage: articleImage,
    type,
    status,
    seoTitle: title.substring(0, validationConfig.post.seoTitle.maxLength),
    seoDescription: `Learn about ${title.toLowerCase()} in this comprehensive guide.`.substring(
      0,
      validationConfig.post.seoDescription.maxLength
    ),
    publishedAt:
      status === 'PUBLISHED'
        ? new Date(Date.now() - randomInt(0, 90) * 24 * 60 * 60 * 1000)
        : status === 'SCHEDULED'
          ? new Date(Date.now() + randomInt(1, 30) * 24 * 60 * 60 * 1000)
          : null,
    authorId,
  }
}

// Main seed function
async function generateTestData() {
  console.log('🚀 Starting test data generation...\n')

  try {
    // 1. Generate Frontend Users
    console.log('👥 Generating frontend users...')
    const users = []
    for (let i = 0; i < 50; i++) {
      const userData = await generateUser()
      const user = await prisma.user.create({
        data: userData,
      })
      users.push(user)
    }
    console.log(`✅ Created ${users.length} frontend users (password: User123!)\n`)

    // 2. Generate Admin Users
    console.log('👨‍💼 Generating admin users...')
    const adminUsers = []
    const defaultPassword = await hashPassword('Admin123!')

    for (let i = 0; i < 10; i++) {
      const adminData = generateAdminUser(i)
      const adminUser = await prisma.adminUser.create({
        data: {
          ...adminData,
          password: defaultPassword,
        },
      })
      adminUsers.push(adminUser)
    }
    console.log(`✅ Created ${adminUsers.length} admin users (password: Admin123!)\n`)

    // 3. Generate Roles
    console.log('🎭 Generating roles...')
    const roleNames = [
      { name: 'Content Editor', description: 'Can create and edit content' },
      {
        name: 'Product Manager',
        description: 'Can manage products and orders',
      },
      { name: 'User Manager', description: 'Can manage frontend users' },
      { name: 'Viewer', description: 'Read-only access to most resources' },
    ]

    const roles = []
    for (const roleData of roleNames) {
      const role = await prisma.adminRole.upsert({
        where: { name: roleData.name },
        update: {},
        create: {
          name: roleData.name.substring(0, validationConfig.role.name.maxLength),
          description: roleData.description.substring(
            0,
            validationConfig.role.description.maxLength
          ),
        },
      })
      roles.push(role)
    }
    console.log(`✅ Created/found ${roles.length} roles\n`)

    // 4. Assign roles to admin users (skip superuser)
    console.log('🔗 Assigning roles to admin users...')
    let roleAssignments = 0
    for (let i = 1; i < adminUsers.length; i++) {
      const rolesToAssign = randomElements(roles, randomInt(1, 2))
      for (const role of rolesToAssign) {
        await prisma.adminUserRole.create({
          data: {
            adminUserId: adminUsers[i].id,
            roleId: role.id,
          },
        })
        roleAssignments++
      }
    }
    console.log(`✅ Created ${roleAssignments} role assignments\n`)

    // 5. Generate Hierarchical Categories (max 3 levels)
    console.log('📁 Generating hierarchical categories...')
    interface CategoryNode { name: string; description: string; children?: CategoryNode[] }
    const categories: { id: string; name: string; slug: string; description: string | null; parentId: string | null }[] = []

    const createCategoryNode = async (catData: CategoryNode, parentId?: string): Promise<void> => {
      const slug = generateSlug(catData.name) + '-' + Math.random().toString(36).substring(2, 6)
      const category = await prisma.category.create({
        data: {
          name: catData.name.substring(0, validationConfig.category.name.maxLength),
          slug,
          description: catData.description.substring(0, validationConfig.category.description.maxLength),
          parentId: parentId || null,
        },
      })
      categories.push(category)
      if (catData.children) {
        for (const child of catData.children) {
          await createCategoryNode(child, category.id)
        }
      }
    }

    for (const rootCat of CATEGORY_TREE) {
      await createCategoryNode(rootCat)
    }
    console.log(`✅ Created ${categories.length} categories (3-level hierarchy)\n`)
    // 6. Generate Tags
    console.log('🏷️  Generating tags...')
    const tags: { id: string; name: string; slug: string }[] = []
    for (const tagName of TAG_NAMES) {
      const slug = generateSlug(tagName)
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: {},
        create: {
          name: tagName.substring(0, validationConfig.post.tagName.maxLength),
          slug,
        },
      })
      tags.push(tag)
    }
    console.log(`✅ Created/found ${tags.length} tags\n`)

    // 7. Generate Articles
    console.log('📝 Generating articles...')
    const articles = []
    for (let i = 0; i < 30; i++) {
      const author = randomElement(adminUsers)
      const postData = generatePost(author.id, 'ARTICLE', i)

      const article = await prisma.post.create({
        data: postData,
      })

      // Assign categories
      const postCategories = randomElements(categories, randomInt(1, 3))
      for (const category of postCategories) {
        await prisma.postCategory.create({
          data: {
            postId: article.id,
            categoryId: category.id,
          },
        })
      }

      // Assign tags
      const postTags = randomElements(tags, randomInt(2, 5))
      for (const tag of postTags) {
        await prisma.postTag.create({
          data: {
            postId: article.id,
            tagId: tag.id,
          },
        })
      }

      articles.push(article)
    }
    console.log(`✅ Created ${articles.length} articles\n`)

    // 8. Generate Pages
    console.log('📄 Generating pages...')
    const pages = []
    for (let i = 0; i < 5; i++) {
      const author = randomElement(adminUsers)
      const pageData = generatePost(author.id, 'PAGE', i)

      const page = await prisma.post.create({
        data: pageData,
      })
      pages.push(page)
    }
    console.log(`✅ Created ${pages.length} pages\n`)

    // 9. Generate Products
    console.log('💰 Generating products...')
    const products = []
    for (let i = 0; i < 12; i++) {
      const productData = generateProduct(i)
      const product = await prisma.product.create({
        data: productData,
      })
      products.push(product)

      // Generate payment methods for each product
      const hasStripe = Math.random() > 0.3
      const hasPayPal = Math.random() > 0.3

      if (hasStripe) {
        const stripeMethod = generatePaymentMethod(product.id, 'stripe')
        await prisma.paymentMethod.create({
          data: stripeMethod,
        })
      }

      if (hasPayPal) {
        const paypalMethod = generatePaymentMethod(product.id, 'paypal')
        await prisma.paymentMethod.create({
          data: paypalMethod,
        })
      }
    }
    console.log(`✅ Created ${products.length} products with payment methods\n`)

    // 10. Generate Orders
    console.log('🛒 Generating orders...')
    const orderStatuses = ['pending', 'completed', 'failed', 'refunded', 'expired']
    const paymentProviders = ['stripe', 'paypal']

    let ordersCreated = 0
    for (let i = 0; i < 100; i++) {
      const user = randomElement(users)
      const product = randomElement(products)
      const status = randomElement(orderStatuses)
      const provider = randomElement(paymentProviders)

      await prisma.order.create({
        data: {
          userId: user.id,
          productId: product.id,
          paymentProvider: provider,
          stripeSessionId:
            provider === 'stripe' ? `cs_test_${Math.random().toString(36).substring(2, 15)}` : null,
          stripeCustomerId:
            provider === 'stripe' ? `cus_${Math.random().toString(36).substring(2, 15)}` : null,
          paypalOrderId:
            provider === 'paypal'
              ? `${Math.random().toString(36).substring(2, 15).toUpperCase()}`
              : null,
          paypalSubscriptionId:
            provider === 'paypal' && Math.random() > 0.5
              ? `I-${Math.random().toString(36).substring(2, 15).toUpperCase()}`
              : null,
          status,
          amount: product.price,
          currency: product.currency,
          metadata: JSON.stringify({
            userAgent: 'Mozilla/5.0',
            ipAddress: `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          }),
          createdAt: new Date(Date.now() - randomInt(0, 180) * 24 * 60 * 60 * 1000),
        },
      })
      ordersCreated++
    }
    console.log(`✅ Created ${ordersCreated} orders\n`)

    // 11. Generate Audit Logs
    console.log('📋 Generating audit logs...')
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT']
    const resources = [
      'user',
      'product',
      'order',
      'article',
      'page',
      'category',
      'role',
      'permission',
    ]

    let logsCreated = 0
    for (let i = 0; i < 200; i++) {
      const adminUser = randomElement(adminUsers)
      await prisma.adminAuditLog.create({
        data: {
          adminUserId: adminUser.id,
          action: randomElement(actions),
          resource: randomElement(resources),
          resourceId: Math.random().toString(36).substring(2, 15),
          details: `Test audit log entry ${i + 1}`,
          ipAddress: `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          userAgent: 'Mozilla/5.0 (Test User Agent)',
          createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
        },
      })
      logsCreated++
    }
    console.log(`✅ Created ${logsCreated} audit logs\n`)

    // Summary
    console.log('✨ Test data generation completed!\n')
    console.log('📊 Summary:')
    console.log(`   - Frontend Users: ${users.length}`)
    console.log(`   - Admin Users: ${adminUsers.length}`)
    console.log(`   - Roles: ${roles.length}`)
    console.log(`   - Categories: ${categories.length}`)
    console.log(`   - Tags: ${tags.length}`)
    console.log(`   - Articles: ${articles.length}`)
    console.log(`   - Pages: ${pages.length}`)
    console.log(`   - Products: ${products.length}`)
    console.log(`   - Orders: ${ordersCreated}`)
    console.log(`   - Audit Logs: ${logsCreated}`)
    console.log('\n💡 Login credentials:')
    console.log('   Frontend Users - Password: User123!')
    console.log('   Admin Users - Username: admin_[firstname]_[lastname], Password: Admin123!')
  } catch (error) {
    console.error('❌ Error generating test data:', error)
    throw error
  }
}

// Run the script
generateTestData()
  .catch(e => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
