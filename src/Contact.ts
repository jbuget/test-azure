export class Contact {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(id: number, firstName: string, lastName: string, phoneNumber: string, email: string, createdAt: Date, updatedAt: Date) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    get name(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}
