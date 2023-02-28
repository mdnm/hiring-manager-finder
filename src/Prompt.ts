interface Person {
  name: string
  title: string
  city?: string
  state?: string
  country?: string
  location?: string
}

export default class Prompt {
  public probableHiringManagers: string[]
  public companyName: string
  public companySize: number | null
  public jobTitle: string
  public jobDescription: string

  constructor(companyName: string, companySize: number | null, jobTitle: string, jobDescription: string) {
    this.companyName = companyName;
    this.companySize = companySize;
    this.jobTitle = jobTitle;
    this.jobDescription = formatJobDescription(jobDescription);
    this.probableHiringManagers = [];
  }

  public addProbableHiringManagers(persons: Person[]) {
    persons.forEach(person => {
      const location = person.city || person.state || person.country ? `(${[person.city, person.state, person.country].filter(Boolean).join(', ')})` : person.location

      this.probableHiringManagers.push(`${person.name}, ${person.title} ${location}`)
    })
  }

  public getFormattedPrompt() {
      const company = `Company: ${this.companyName} `
      const companySize = this.companySize ? `Company Size: ${this.companySize}` : ''
      const jobTitle = `Job Title: ${this.jobTitle}`
      const jobDescription = `Job Description: "${this.jobDescription}"`
      const companyPeople = `Company People: \n${this.probableHiringManagers.map(person => `- ${person}`).join('\n')}`
      
      return [company, companySize, jobTitle, jobDescription, companyPeople].join('\n')
  }
}

function formatJobDescription(jobDescription: string) {
  if (!jobDescription) {
    return ''
  }

  const words = jobDescription.split(' ')
  
  const trimmedWords = words.map(word => word.trim())
  
  const filteredWords = trimmedWords.filter(filterWhiteSpacesAndWordsWithoutCharacters)
  
  const formattedJobDescription = filteredWords.join(' ')

  return formattedJobDescription
}

function filterWhiteSpacesAndWordsWithoutCharacters(word: string): boolean {
  const isWhiteSpace = word.length === 0
  const hasOnlyCharacters = new RegExp(/^[a-zA-Z]+$/).test(word)

  return !isWhiteSpace && hasOnlyCharacters
}
