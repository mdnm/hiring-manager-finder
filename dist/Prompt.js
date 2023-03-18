"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Prompt {
    probableHiringManagers;
    companyName;
    companySize;
    jobTitle;
    jobDescription;
    constructor(companyName, companySize, jobTitle, jobDescription) {
        this.companyName = companyName;
        this.companySize = companySize;
        this.jobTitle = jobTitle;
        this.jobDescription = formatJobDescription(jobDescription);
        this.probableHiringManagers = [];
    }
    addProbableHiringManagers(persons) {
        persons.forEach(person => {
            const location = person.city || person.state || person.country ? `(${[person.city, person.state, person.country].filter(Boolean).join(', ')})` : person.location;
            this.probableHiringManagers.push(`${person.name}, ${person.title} ${location}`);
        });
    }
    getFormattedPrompt() {
        const company = `Company: ${this.companyName} `;
        const companySize = this.companySize ? `Company Size: ${this.companySize}` : '';
        const jobTitle = `Job Title: ${this.jobTitle}`;
        const jobDescription = `Job Description: "${this.jobDescription}"`;
        const companyPeople = `Company People: \n${this.probableHiringManagers.map(person => `- ${person}`).join('\n')}`;
        return [company, companySize, jobTitle, jobDescription, companyPeople].join('\n');
    }
}
exports.default = Prompt;
function formatJobDescription(jobDescription) {
    if (!jobDescription) {
        return '';
    }
    const words = jobDescription.split(' ');
    const trimmedWords = words.map(word => word.trim());
    const filteredWords = trimmedWords.filter(filterWhiteSpacesAndWordsWithoutCharacters);
    const formattedJobDescription = filteredWords.join(' ');
    return formattedJobDescription;
}
function filterWhiteSpacesAndWordsWithoutCharacters(word) {
    const isWhiteSpace = word.length === 0;
    const hasOnlyCharacters = new RegExp(/^[a-zA-Z]+$/).test(word);
    return !isWhiteSpace && hasOnlyCharacters;
}
//# sourceMappingURL=Prompt.js.map