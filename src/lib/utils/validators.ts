/**
 * Validate email format using RFC 5322 standard
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate email with additional checks for common providers
 */
export function validateEmailStrict(email: string): {
  valid: boolean
  error?: 'EMAIL_EMPTY' | 'EMAIL_INVALID' | 'EMAIL_TOO_LONG' | 'EMAIL_LOCAL_TOO_LONG'
} {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'EMAIL_EMPTY' }
  }

  if (!validateEmail(email)) {
    return { valid: false, error: 'EMAIL_INVALID' }
  }

  // Check email length
  if (email.length > 254) {
    return { valid: false, error: 'EMAIL_TOO_LONG' }
  }

  const [localPart] = email.split('@')

  // Check local part length
  if (localPart.length > 64) {
    return { valid: false, error: 'EMAIL_LOCAL_TOO_LONG' }
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return { valid: false, error: 'EMAIL_INVALID' }
  }

  return { valid: true }
}

/**
 * Validate name field
 * - Length: 1-32 characters
 * - Allows: Chinese, English, numbers, underscores, hyphens, spaces
 */
export function validateName(name: string): {
  valid: boolean
  error?: 'NAME_EMPTY' | 'NAME_TOO_LONG' | 'NAME_INVALID_CHARACTERS'
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'NAME_EMPTY' }
  }

  const trimmedName = name.trim()

  if (trimmedName.length > 32) {
    return { valid: false, error: 'NAME_TOO_LONG' }
  }

  // Allow Chinese, English, numbers, underscores, hyphens, and spaces
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_\- ]+$/
  if (!nameRegex.test(trimmedName)) {
    return {
      valid: false,
      error: 'NAME_INVALID_CHARACTERS',
    }
  }

  return { valid: true }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Validate verification code
 * - Must be 6 digits
 */
export function validateVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/**
 * Validate password strength
 * Returns a score out of 100, a level, and any error message keys
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  score: number
  level: 'weak' | 'medium' | 'strong' | 'none'
  errors: string[]
} {
  if (!password) {
    return { valid: false, score: 0, level: 'none', errors: [] }
  }

  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 20
  } else {
    errors.push('password_strength.length')
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 20
  } else {
    errors.push('password_strength.uppercase')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 20
  } else {
    errors.push('password_strength.lowercase')
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 20
  } else {
    errors.push('password_strength.number')
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 20
  } else {
    errors.push('password_strength.special')
  }

  // Determine level
  let level: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 80) {
    level = 'strong'
  } else if (score >= 60) {
    level = 'medium'
  }

  // Check against common weak passwords (deduct if too common)
  const weakPasswords = ['password', '12345678', 'qwerty123', 'abc12345', 'password123']
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('password_strength.too_common')
    level = 'weak' // Force weak if too common
  }

  return {
    valid: errors.length === 0,
    score,
    level,
    errors,
  }
}

/**
 * Map name validation error to i18n key
 */
export function getNameErrorKey(error?: string): string {
  switch (error) {
    case 'NAME_EMPTY':
      return 'register.name_empty'
    case 'NAME_TOO_LONG':
      return 'register.name_length'
    case 'NAME_INVALID_CHARACTERS':
      return 'register.name_invalid'
    default:
      return 'register.name_invalid'
  }
}

/**
 * Map email validation error to i18n key
 */
export function getEmailErrorKey(error?: string): string {
  switch (error) {
    case 'EMAIL_EMPTY':
      return 'register.email_empty'
    case 'EMAIL_INVALID':
      return 'register.email_invalid'
    case 'EMAIL_TOO_LONG':
      return 'register.email_too_long'
    case 'EMAIL_LOCAL_TOO_LONG':
      return 'register.email_too_long'
    default:
      return 'register.email_invalid'
  }
}

/**
 * Check if password meets the minimum strength requirement
 */
export function checkPasswordStrength(
  password: string,
  minStrength: 'weak' | 'medium' | 'strong'
): { isValid: boolean; level: 'weak' | 'medium' | 'strong' | 'none' } {
  const strengthResult = validatePasswordStrength(password)
  const strengthWeight = {
    none: 0,
    weak: 1,
    medium: 2,
    strong: 3,
  }
  const isValid = strengthWeight[strengthResult.level] >= strengthWeight[minStrength]

  return {
    isValid,
    level: strengthResult.level,
  }
}
