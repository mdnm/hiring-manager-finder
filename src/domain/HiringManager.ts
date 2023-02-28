
export class HiringManager {
  email: string | null
  emailStatus: string | null
  linkedinURL: string | null
  fullName: string | null
  firstName: string | null
  lastName: string | null
  title: string | null
  location: string | null

  constructor({ email, emailStatus, linkedinURL, fullName, firstName, lastName, title, location }: { email?: string, emailStatus?: string, linkedinURL?: string, firstName?: string, lastName?: string, title?: string, location?: string, fullName?: string }) {
    this.email = email ?? null
    this.emailStatus = emailStatus ?? null
    this.linkedinURL = linkedinURL ?? null
    this.firstName = firstName ?? null
    this.lastName = lastName ?? null
    this.title = title ?? null
    this.location = location ?? null
    this.fullName = fullName ? fullName : `${firstName} ${lastName}`
  }

  public setLocation({ city, state, country }: { city?: string, state?: string, country?: string }) {
    if (!city && !state && !country) {
      return
    }

    const formattedCity = city ? `${city}, ` : ''
    const formattedState = state ? `${state}, ` : ''
    
    this.location = formattedCity + formattedState + country || ''
  }
}