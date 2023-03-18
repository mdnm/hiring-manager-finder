"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Company = void 0;
class Company {
    name;
    employeeCount;
    domain;
    constructor({ name, employeeCount, domain }) {
        this.name = name ?? null;
        this.employeeCount = employeeCount ?? null;
        this.domain = domain ?? null;
    }
}
exports.Company = Company;
//# sourceMappingURL=Company.js.map