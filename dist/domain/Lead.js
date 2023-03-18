"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lead = exports.actionDepartmentMap = void 0;
const departments = ["executive", "founder", "sales_executive", "master_sales", "finance_executive", "human_resources_executive", "information_technology_executive", "marketing_executive", "operations_executive", "master_engineering_technical", "design", "master_finance", "master_human_resources", "master_operations", "master_information_technology", "master_marketing", "operations_executive", "logistics"];
exports.actionDepartmentMap = {
    "AutoUp": ["sales_executive", "master_sales"],
    "AutoUp BDR": ["sales_executive", "master_sales"],
    "Malt NL Back-End": ["information_technology_executive", "master_information_technology"],
    "Malt NL Marketing": ["marketing_executive", "master_marketing"],
    "Malt NL Graphic Design Indeed": ["marketing_executive", "design", "master_marketing"],
    //"Malt NL Indeed Interim": ["human_resources_executive", "master_human_resources"], // confirm
    "Malt NL Engineering": ["master_engineering_technical", "master_operations", "operations_executive"],
    "Malt NL Finance": ["finance_executive", "master_finance"],
    //"Malt BE Freelance": ["sales_executive", "master_sales"], // confirm
    //"Malt BE Belgium Total": ["sales_executive", "master_sales"], // confirm
    //"Malt BE Wallonia Total": ["sales_executive", "master_sales"], // confirm
    "J2BD Marketing": ["marketing_executive", "master_marketing"],
    "J2BD Chef de Secteur": ["master_engineering_technical", "master_operations", "master_marketing", "operations_executive", "marketing_executive"],
    "J2BD Head of Sales": ["sales_executive", "master_sales"],
    "J2BD Export": ["operations_executive", "logistics"],
    "J2BD HR Manager": ["human_resources_executive", "master_human_resources"],
    "Digital Orbis IT": ["information_technology_executive", "master_information_technology"],
    "Digital Orbis Fin": ["finance_executive", "master_finance"],
};
const actionLocationMap = {
    "AutoUp": ["United States"],
    "AutoUp BDR": ["United States"],
    "Malt NL Back-End": ["Netherlands"],
    "Malt NL Marketing": ["Netherlands"],
    "Malt NL Graphic Design Indeed": ["Netherlands"],
    "Malt NL Indeed Interim": ["Netherlands"],
    "Malt NL Engineering": ["Netherlands"],
    "Malt NL Finance": ["Netherlands"],
    "Malt BE Freelance": ["Belgium"],
    "Malt BE Belgium Total": ["Belgium"],
    "Malt BE Wallonia Total": ["Belgium"],
    "J2BD Marketing": ["France"],
    "J2BD Chef de Secteur": ["France"],
    "J2BD Head of Sales": ["France"],
    "J2BD Export": ["France"],
    "J2BD HR Manager": ["France"],
    "Digital Orbis IT": ["Netherlands"],
    "Digital Orbis Fin": ["Netherlands"],
};
class Lead {
    id;
    jobOpportunity;
    potentialHiringManager;
    departments;
    location;
    company;
    action;
    source;
    constructor({ id, action, jobOpportunity, company }) {
        this.id = id;
        this.action = action;
        this.jobOpportunity = jobOpportunity;
        this.company = company;
        this.source = "Mateus API";
        this.departments = this.getDepartments();
        this.location = actionLocationMap[action] ?? null;
    }
    setHiringManager(hiringManager) {
        this.potentialHiringManager = hiringManager;
    }
    getSource() {
        if (this.potentialHiringManager) {
            return this.source;
        }
        if (!this.company || this.company.employeeCount === 0) {
            return `${this.source} (Company not found)`;
        }
        return `${this.source} (No match found)`;
    }
    getDepartments() {
        const founderDepartments = ["executive", "founder"];
        const actionDepartment = exports.actionDepartmentMap[this.action];
        if (actionDepartment) {
            return [...founderDepartments, ...actionDepartment];
        }
        const defaultDepartments = [...founderDepartments, 'human_resources_executive', "master_human_resources"];
        return defaultDepartments;
    }
}
exports.Lead = Lead;
//# sourceMappingURL=Lead.js.map