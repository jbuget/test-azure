export class Contact {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    photo?: string | null;
    createdAt: Date;
    updatedAt: Date;

    constructor(id: number, firstName: string, lastName: string, phoneNumber: string, email: string, createdAt: Date, updatedAt: Date, photo?: string | null) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.photo = photo ?? null;
    }

    get name(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}
