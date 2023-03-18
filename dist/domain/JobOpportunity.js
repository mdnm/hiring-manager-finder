"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOpportunity = void 0;
const jobSeniorities = ['junior', 'senior', 'manager', 'director', 'head', 'vp', "c_suite", "partner", "owner", "founder"];
const defaultPotentialHiringManagerSeniorities = ['manager', 'director', 'head', 'vp', "c_suite", "partner", "owner", "founder"];
class JobOpportunity {
    title;
    seniority;
    description;
    location;
    url;
    constructor({ title, description, location, url }) {
        this.title = title ?? null;
        this.description = description ?? null;
        this.location = location ?? null;
        this.url = url ?? null;
        this.seniority = this.getSeniority();
    }
    getSeniority() {
        if (!this.title) {
            return null;
        }
        const juniorSeniorities = ['junior', 'intern', 'associate', 'representative'];
        const seniority = this.title.match(/(junior|intern|associate|representative|senior|manager|director|head|vp|vice president|chargé|gestionnaire|responsable|chef de|directeur)/i);
        if (!seniority) {
            return null;
        }
        const formattedSeniority = seniority[0].toLowerCase();
        if (juniorSeniorities.includes(formattedSeniority)) {
            return 'junior';
        }
        if (formattedSeniority === 'chef de' || formattedSeniority === 'chargé' || formattedSeniority === 'responsable' || formattedSeniority === 'gestionnaire') {
            return 'manager';
        }
        if (formattedSeniority === 'directeur') {
            return 'director';
        }
        if (formattedSeniority === 'vp' || formattedSeniority === 'vice president') {
            return 'vp';
        }
        if (jobSeniorities.includes(formattedSeniority)) {
            return formattedSeniority;
        }
        return null;
    }
    isEqualTo(jobOpportunity) {
        return this.title === jobOpportunity.title && this.description === jobOpportunity.description && this.location === jobOpportunity.location;
    }
    getPossibleManagerSeniorities() {
        if (!this.seniority) {
            return defaultPotentialHiringManagerSeniorities;
        }
        const seniorityIndex = jobSeniorities.indexOf(this.seniority);
        if (seniorityIndex === -1) {
            return defaultPotentialHiringManagerSeniorities;
        }
        const senioritiesFromPotentialHiringManagers = jobSeniorities.slice(seniorityIndex);
        return senioritiesFromPotentialHiringManagers;
    }
    getSource() {
        if (/indeed/.test(this.url ?? '')) {
            return 'indeed';
        }
        if (/linkedin/.test(this.url ?? '')) {
            return 'linkedin';
        }
        return '';
    }
}
exports.JobOpportunity = JobOpportunity;
//# sourceMappingURL=JobOpportunity.js.map