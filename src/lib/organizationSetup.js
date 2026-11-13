import { supabase } from './supabaseClient'

export async function ensureOrganization(user) {
  if (!user?.id) {
    throw new Error('Your authenticated session could not be verified.')
  }

  // If the profile already exists, setup is complete.
  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileLookupError) {
    throw new Error('Unable to check your organization profile. Please retry.')
  }

  if (existingProfile?.organization_id) {
    return existingProfile.organization_id
  }

  const organizationName = user.user_metadata?.organization_name?.trim()

  if (!organizationName || organizationName.length < 2) {
    throw new Error(
      'Your account has no saved organization name. Please contact support to complete setup.'
    )
  }

  // Reuse an organization created by this user if a previous attempt
  // created the organization but failed before creating the profile.
  const { data: existingOrganization, error: organizationLookupError } =
    await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

  if (organizationLookupError) {
    throw new Error(`Organization lookup failed: ${organizationLookupError.message}`)
  }

  let organizationId = existingOrganization?.id

  if (!organizationId) {
    const { data: newOrganization, error: organizationError } = await supabase
      .from('organizations')
      .insert({ name: organizationName })
      .select('id')
      .single()

    if (organizationError) {
      throw new Error(`Organization creation failed: ${organizationError.message}`)
    }

    organizationId = newOrganization.id
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      organization_id: organizationId,
    })

  if (profileError) {
    // Handle a retry or concurrent setup if the profile was created already.
    const { data: retryProfile, error: retryError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (retryError || !retryProfile?.organization_id) {
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    return retryProfile.organization_id
  }

  return organizationId
}
