"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiringManager = void 0;
class HiringManager {
    email;
    emailStatus;
    linkedinURL;
    fullName;
    firstName;
    lastName;
    title;
    location;
    constructor({ email, emailStatus, linkedinURL, fullName, firstName, lastName, title, location }) {
        this.email = email ?? null;
        this.emailStatus = emailStatus ?? null;
        this.linkedinURL = linkedinURL ?? null;
        this.firstName = firstName ?? null;
        this.lastName = lastName ?? null;
        this.title = title ?? null;
        this.location = location ?? null;
        this.fullName = fullName ? fullName : `${firstName} ${lastName}`;
    }
    setLocation({ city, state, country }) {
        if (!city && !state && !country) {
            return;
        }
        const formattedCity = city ? `${city}, ` : '';
        const formattedState = state ? `${state}, ` : '';
        this.location = formattedCity + formattedState + country || '';
    }
}
exports.HiringManager = HiringManager;
//# sourceMappingURL=HiringManager.js.map