// lib/getBusinessId.ts
//
// Single source of truth for resolving the current user's business_id.
// Call this at the top of any page or server action that needs business_id.
// Returns the business id string, or throws a typed error you can handle.

import { supabase } from './supabase'

export type BusinessIdError =
  | { code: 'NOT_AUTHENTICATED'; message: string }
  | { code: 'NO_BUSINESS'; message: string }
  | { code: 'DB_ERROR'; message: string }

export class BusinessIdException extends Error {
  constructor(public readonly error: BusinessIdError) {
    super(error.message)
    this.name = 'BusinessIdException'
  }
}

/**
 * Resolves the business_id for the currently logged-in user.
 *
 * Flow:
 *   1. Get auth user from Supabase session
 *   2. Query businesses table for owner_id = user.id
 *   3. Return the business id
 *
 * Throws BusinessIdException on any failure — catch it in the caller.
 *
 * Usage:
 *   const businessId = await getBusinessId()
 */
export async function getBusinessId(): Promise<string> {
  // Step 1: Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new BusinessIdException({
      code: 'NOT_AUTHENTICATED',
      message: 'No authenticated user. Please log in.',
    })
  }

  // Step 2: Look up their business
  const { data: business, error: dbError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (dbError) {
    throw new BusinessIdException({
      code: 'DB_ERROR',
      message: `Could not fetch business: ${dbError.message}`,
    })
  }

  if (!business) {
    throw new BusinessIdException({
      code: 'NO_BUSINESS',
      message: 'No business found for this user. Please complete setup.',
    })
  }

  return business.id
}

/**
 * Same as getBusinessId() but returns null instead of throwing.
 * Useful when you want to handle the null case inline.
 *
 * Usage:
 *   const businessId = await getBusinessIdOrNull()
 *   if (!businessId) { redirect to setup... }
 */
export async function getBusinessIdOrNull(): Promise<string | null> {
  try {
    return await getBusinessId()
  } catch {
    return null
  }
}