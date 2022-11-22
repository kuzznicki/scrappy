import { AvailabilityById } from "../types";

type Skill = { 
    name: string, 
    level: number
};
type Contract = {
    salary: {
        from: number,
        to: number,
        currency: string
    },
    type: string
};

export default function (json: object, siteUrl: string): [AvailabilityById, boolean] {
    const res: AvailabilityById = {};

    const skillsToString = (skills: Skill[]) => skills.map(skill => `${skill.name}(${skill.level})`).join(', ');
    const contractsToString = (contracts: Contract[]) => contracts.map(contract => {
        const salaryString = contract.salary
            ? `${contract.salary.from}-${contract.salary.to}${contract.salary.currency}`
            : '?';

        return salaryString + ` (${contract.type})`;
    }).join('; ');

    if (Array.isArray(json)) {
        for (const offer of json) {
            const skills = skillsToString(offer.skills as Skill[]);
            const salaries = contractsToString(offer.employment_types as Contract[]);

            const position = `${offer.title} (${offer.experience_level})`;
            const company = `🏢 company: ${offer.company_name}(${offer.company_size})`;
            const details = [
                `⭐️ skills: ${skills}`,
                `💶 salary: ${salaries}`
            ].join('\n');

            res[offer.id] = {
                url: 'https://justjoin.it/offers/' + offer.id,
                name: [position, company, details].join('\n') + '\n',
                available: true
            }
        }
    }

    return [res, false];
}
